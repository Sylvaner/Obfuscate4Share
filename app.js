(function () {
    var STORAGE_KEY = "obfuscate4share.domain";
    var PASSWORD_KEYS = [
        "password",
        "passwd",
        "pwd",
        "userpassword",
        "db_password",
        "database_password",
        "ldap_bind_password",
        "motdepasse"
    ];
    var USER_KEYS = [
        "user",
        "username",
        "login",
        "account",
        "bind_user"
    ];
    var SECRET_KEYS = {
        secret: "OBFUSCATED_SECRET",
        api_key: "OBFUSCATED_KEY",
        apikey: "OBFUSCATED_KEY",
        token: "OBFUSCATED_TOKEN",
        access_token: "OBFUSCATED_TOKEN",
        refresh_token: "OBFUSCATED_TOKEN",
        client_secret: "OBFUSCATED_SECRET",
        private_key: "OBFUSCATED_KEY",
        encryption_key: "OBFUSCATED_KEY",
        secret_key: "OBFUSCATED_KEY"
    };

    var sourceInput = document.getElementById("sourceInput");
    var resultOutput = document.getElementById("resultOutput");
    var domainInput = document.getElementById("domainInput");
    var fileTypeSelect = document.getElementById("fileTypeSelect");
    var activeTypeLabel = document.getElementById("activeType");
    var autoTypeInfo = document.getElementById("autoTypeInfo");
    var verifyButton = document.getElementById("verifyButton");
    var copyButton = document.getElementById("copyButton");
    var ipRangeInput = document.getElementById("ipRangeInput");
    var toggleAdvancedButton = document.getElementById("toggleAdvancedButton");
    var advancedSection = document.getElementById("advancedSection");

    loadStoredDomain();
    bindEvents();
    updateOutput();

    function bindEvents() {
        sourceInput.addEventListener("input", updateOutput);
        domainInput.addEventListener("input", function () {
            saveDomain();
            updateOutput();
        });
        fileTypeSelect.addEventListener("change", function () {
            updateTypeStatusVisibility();
            updateOutput();
        });
        ipRangeInput.addEventListener("input", updateOutput);
        verifyButton.addEventListener("click", unlockCopyButton);
        toggleAdvancedButton.addEventListener("click", toggleAdvancedSection);
        copyButton.addEventListener("click", copyResult);
    }

    function loadStoredDomain() {
        var savedDomain = window.localStorage.getItem(STORAGE_KEY);

        if (savedDomain) {
            domainInput.value = savedDomain;
        }
    }

    function saveDomain() {
        window.localStorage.setItem(STORAGE_KEY, normalizeDomain(domainInput.value));
    }

    function getSelectedFileType(detectedType) {
        if (fileTypeSelect.value === "auto") {
            return detectedType;
        }

        return fileTypeSelect.value;
    }

    function updateTypeStatusVisibility() {
        var isAuto = fileTypeSelect.value === "auto";
        autoTypeInfo.style.display = isAuto ? "block" : "none";
        copyButton.disabled = true;
    }

    function unlockCopyButton() {
        copyButton.disabled = false;
    }

    function updateOutput() {
        var sourceText = sourceInput.value;
        var domain = normalizeDomain(domainInput.value);
        var detectedType = detectFileType(sourceText);
        var selectedType = getSelectedFileType(detectedType);
        var ipRange = ipRangeInput.value.trim();

        activeTypeLabel.textContent = detectedType;
        resultOutput.value = obfuscateText(sourceText, selectedType, domain, ipRange);
        updateTypeStatusVisibility();
    }

    function detectFileType(text) {
        var trimmed = text.trim();
        var lines = getMeaningfulLines(text);
        var yamlScore = 0;
        var propertiesScore = 0;
        var dotfileScore = 0;
        var iniScore = 0;

        if (!trimmed) {
            return "text";
        }

        if (trimmed[0] === "{" || trimmed[0] === "[") {
            try {
                JSON.parse(trimmed);
                return "json";
            } catch (error) {
                return "json";
            }
        }

        lines.forEach(function (line) {
            if (/^\[[^\]]+\]$/.test(line)) {
                iniScore += 3;
            }

            if (/^(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=/.test(line)) {
                dotfileScore += 2;
            }

            if (/^[A-Za-z0-9_.-]+\s*[=:]\s*.+$/.test(line)) {
                propertiesScore += 2;
            }

            if (/^\s*-\s+.+$/.test(line) || /^\s*["']?[A-Za-z0-9_.-]+["']?\s*:\s*.+$/.test(line)) {
                yamlScore += 2;
            }
        });

        if (iniScore > 0 && iniScore >= propertiesScore) {
            return "ini";
        }

        if (yamlScore > propertiesScore && yamlScore >= dotfileScore) {
            return "yaml";
        }

        if (dotfileScore > 0 && dotfileScore >= propertiesScore) {
            return "dotfile";
        }

        if (propertiesScore > 0) {
            return "properties";
        }

        return "text";
    }

    function obfuscateText(text, fileType, domain, ipRange) {
        var result = text;

        result = obfuscatePemBlocks(result);
        result = obfuscateUrlCredentials(result, domain);
        result = obfuscateEmails(result, domain);
        result = obfuscateStructuredFields(result, PASSWORD_KEYS, "OBFUSCATED_PASSWORD");
        result = obfuscateStructuredFields(result, USER_KEYS, "OBFUSCATED_USER");
        result = obfuscateSecretFields(result);
        result = obfuscateLdapEntries(result, domain);
        result = obfuscateStandaloneLdapDomains(result, domain);
        result = obfuscateDomains(result, domain);
        result = obfuscateIpRange(result, ipRange);
        result = obfuscateBase64Strings(result, fileType);

        return result;
    }

    function obfuscatePemBlocks(text) {
        return text.replace(/-----BEGIN ([A-Z0-9 ]+)-----[\s\S]*?-----END \1-----/g, function (match, label) {
            var upperLabel = label.toUpperCase();

            if (upperLabel.indexOf("CERTIFICATE") !== -1) {
                return "-----BEGIN CERTIFICATE-----OBFUSCATED_CERTIFICATE-----END CERTIFICATE-----";
            }

            if (upperLabel.indexOf("PRIVATE KEY") !== -1) {
                return "-----BEGIN PRIVATE KEY-----OBFUSCATED_PRIVATE_KEY-----END PRIVATE KEY-----";
            }

            if (upperLabel.indexOf("PUBLIC KEY") !== -1) {
                return "-----BEGIN PUBLIC KEY-----OBFUSCATED_PUBLIC_KEY-----END PUBLIC KEY-----";
            }

            return "-----BEGIN " + label + "-----OBFUSCATED_PEM_BLOCK-----END " + label + "-----";
        });
    }

    function obfuscateUrlCredentials(text, domain) {
        return text.replace(/([a-z][a-z0-9+.-]*:\/\/)([^\s:@/]+):([^\s@/]+)@([^\s/]+)/gi, function (match, scheme, user, password, host) {
            var obfuscatedHost = obfuscateHost(host, domain);
            return scheme + "OBFUSCATED_USER:OBFUSCATED_PASSWORD@" + obfuscatedHost;
        });
    }

    function obfuscateEmails(text, domain) {
        if (!domain) {
            return text;
        }

        return text.replace(/\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi, function (match, host) {
            if (!hostMatchesDomain(host, domain)) {
                return match;
            }

            return "user-obfuscated@obfuscated.tld";
        });
    }

    function obfuscateStructuredFields(text, keys, replacement) {
        var lowerKeys = keys.map(function (key) {
            return key.toLowerCase();
        });

        return text.split(/\r?\n/).map(function (line) {
            var parts = splitKeyValueLine(line);

            if (!parts) {
                return line;
            }

            if (lowerKeys.indexOf(parts.key.toLowerCase()) === -1) {
                return line;
            }

            return parts.prefix + replaceValueSegment(parts.value, replacement);
        }).join("\n");
    }

    function obfuscateSecretFields(text) {
        return text.split(/\r?\n/).map(function (line) {
            var parts = splitKeyValueLine(line);
            var replacement;

            if (!parts) {
                return line;
            }

            replacement = SECRET_KEYS[parts.key.toLowerCase()];

            if (!replacement) {
                return line;
            }

            return parts.prefix + replaceValueSegment(parts.value, replacement);
        }).join("\n");
    }

    function obfuscateLdapEntries(text, domain) {
        var result = text.replace(/\b(cn|uid)=([^,\n]+)((?:,[A-Za-z][A-Za-z0-9-]*=[^,\n]+)+)/gi, function (match, key, userValue, suffix) {
            return key + "=OBFUSCATED_USER" + obfuscateLdapDomainSuffix(suffix, domain);
        });

        return result.replace(/(\bbind_dn\b|\bbinddn\b)(\s*[:=]\s*)(["'])?([^"'\n]+)(\3)?/gi, function (match, key, separator, quote, value) {
            var protectedValue = value.replace(/\b(cn|uid)=([^,\n]+)/i, function (segment, ldapKey) {
                return ldapKey + "=OBFUSCATED_USER";
            });

            protectedValue = obfuscateLdapDomainSuffix(protectedValue, domain);

            return key + separator + (quote || "") + protectedValue + (quote || "");
        });
    }

    function obfuscateStandaloneLdapDomains(text, domain) {
        return obfuscateLdapDomainSuffix(text, domain);
    }

    function obfuscateLdapDomainSuffix(text, domain) {
        var normalized = normalizeDomain(domain);
        var dcSequence;
        var escaped;
        var regex;

        if (!normalized) {
            return text;
        }

        dcSequence = normalized.split(".").map(function (part) {
            return "dc=" + part;
        }).join(",");
        escaped = escapeRegExp(dcSequence);
        regex = new RegExp("((?:dc=[A-Za-z0-9-]+,)*)" + escaped, "gi");

        return text.replace(regex, function (match, prefix) {
            return (prefix || "") + "dc=obfuscated,dc=tld";
        });
    }

    function obfuscateDomains(text, domain) {
        var normalized = normalizeDomain(domain);
        var escaped;
        var regex;

        if (!normalized) {
            return text;
        }

        escaped = escapeRegExp(normalized);
        regex = new RegExp("\\b(?:[a-z0-9-]+\\.)*" + escaped + "\\b", "gi");

        return text.replace(regex, function (match) {
            return obfuscateHost(match, normalized);
        });
    }

    function obfuscateBase64Strings(text, fileType) {
        var minimumLength = fileType === "text" ? 56 : 40;
        var regex = new RegExp("(^|[^A-Za-z0-9+/=])([A-Za-z0-9+/]{" + minimumLength + ",}={0,2})(?=$|[^A-Za-z0-9+/=])", "gm");

        return text.replace(regex, function (match, prefix) {
            return prefix + "OBFUSCATED_BASE64";
        });
    }

    function splitKeyValueLine(line) {
        var match = line.match(/^(\s*(?:export\s+)?["']?)([A-Za-z0-9_.-]+)(["']?\s*[:=]\s*)(.+)$/);

        if (!match) {
            return null;
        }

        return {
            prefix: match[1] + match[2] + match[3],
            key: match[2],
            value: match[4]
        };
    }

    function replaceValueSegment(value, replacement) {
        var leadingSpaces = value.match(/^\s*/)[0];
        var body = value.slice(leadingSpaces.length);
        var quote;
        var closingIndex;
        var tailMatch;

        if (!body) {
            return leadingSpaces + replacement;
        }

        if (body[0] === '"' || body[0] === "'") {
            quote = body[0];
            closingIndex = findClosingQuote(body, quote);

            if (closingIndex > 0) {
                return leadingSpaces + quote + replacement + quote + body.slice(closingIndex + 1);
            }
        }

        tailMatch = body.match(/^(.+?)(\s*,?\s*(?:[#;].*)?)$/);

        if (!tailMatch) {
            return leadingSpaces + replacement;
        }

        return leadingSpaces + replacement + tailMatch[2];
    }

    function findClosingQuote(text, quote) {
        var index = 1;

        while (index < text.length) {
            if (text[index] === quote && text[index - 1] !== "\\") {
                return index;
            }

            index += 1;
        }

        return -1;
    }

    function hostMatchesDomain(host, domain) {
        var normalizedHost = normalizeHost(host);
        var normalizedDomain = normalizeDomain(domain);

        if (!normalizedHost || !normalizedDomain) {
            return false;
        }

        return normalizedHost === normalizedDomain || normalizedHost.slice(-(normalizedDomain.length + 1)) === "." + normalizedDomain;
    }

    function obfuscateHost(host, domain) {
        var hostParts = splitHostAndPort(host);
        var normalizedDomain = normalizeDomain(domain);
        var normalizedHost = normalizeHost(hostParts.host);
        var prefix;

        if (!normalizedDomain || !hostMatchesDomain(hostParts.host, normalizedDomain)) {
            return host;
        }

        if (normalizedHost === normalizedDomain) {
            return "obfuscated.tld" + hostParts.port;
        }

        prefix = normalizedHost.slice(0, -(normalizedDomain.length + 1));
        return prefix + ".obfuscated.tld" + hostParts.port;
    }

    function splitHostAndPort(host) {
        var index;

        if (!host || host.indexOf(":") === -1 || host.indexOf("]") !== -1) {
            return { host: host, port: "" };
        }

        index = host.lastIndexOf(":");

        if (index === -1 || host.indexOf(":") !== index) {
            return { host: host, port: "" };
        }

        return {
            host: host.slice(0, index),
            port: host.slice(index)
        };
    }

    function normalizeDomain(domain) {
        return String(domain || "")
            .trim()
            .toLowerCase()
            .replace(/^\.+|\.+$/g, "");
    }

    function normalizeHost(host) {
        return String(host || "")
            .trim()
            .toLowerCase()
            .replace(/^\.+|\.+$/g, "");
    }

    function getMeaningfulLines(text) {
        return text.split(/\r?\n/).map(function (line) {
            return line.trim();
        }).filter(function (line) {
            return line && line[0] !== "#" && !/^\/\//.test(line);
        });
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function copyResult() {
        var text = resultOutput.value;
        var previousLabel = copyButton.textContent;

        if (!text) {
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                showCopyState("Copied!");
            }).catch(function () {
                fallbackCopy(text, previousLabel);
            });
            return;
        }

        fallbackCopy(text, previousLabel);
    }

    function fallbackCopy(text) {
        resultOutput.removeAttribute("readonly");
        resultOutput.select();
        document.execCommand("copy");
        resultOutput.setAttribute("readonly", "readonly");
        resultOutput.setSelectionRange(0, 0);
        showCopyState("Copied!");
    }

    function showCopyState(label) {
        copyButton.textContent = label;
        window.setTimeout(function () {
            copyButton.textContent = "Copy result";
        }, 1600);
    }

    function toggleAdvancedSection() {
        var isHidden = advancedSection.style.display === "none" || advancedSection.style.display === "";
        advancedSection.style.display = isHidden ? "grid" : "none";
        toggleAdvancedButton.textContent = isHidden ? "Hide advanced" : "Advanced";
    }


    function obfuscateIpRange(text, cidrString) {
        if (!cidrString) {
            return text;
        }

        var cidr = parseIpFilter(cidrString);

        if (!cidr) {
            return text;
        }

        return text.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, function (match) {
            if (ipInRange(match, cidr)) {
                return getObfuscatedIp(match, cidr);
            }

            return match;
        });
    }

    function parseIpFilter(input) {
        var value = String(input || "").trim();
        var ipOnly;

        if (!value) {
            return null;
        }

        ipOnly = parseIp(value);

        if (ipOnly) {
            return {
                type: "single",
                ipOctets: ipOnly
            };
        }

        return parseCidr(value);
    }

    function parseCidr(cidrString) {
        var match = String(cidrString || "").trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d|[12]\d|3[0-2])$/);
        var ipOctets;
        var prefix;

        if (!match) {
            return null;
        }

        ipOctets = parseIp(match[1]);
        prefix = parseInt(match[2], 10);

        if (!ipOctets) {
            return null;
        }

        return {
            type: "cidr",
            networkOctets: ipOctets,
            prefix: prefix,
            originalIp: match[1]
        };
    }

    function parseIp(ip) {
        var parts = ip.split(".");
        var octetText;
        var octets = [];

        if (parts.length !== 4) {
            return null;
        }

        for (var i = 0; i < 4; i++) {
            octetText = parts[i];

            if (!/^\d{1,3}$/.test(octetText)) {
                return null;
            }

            var octet = parseInt(octetText, 10);

            if (isNaN(octet) || octet < 0 || octet > 255) {
                return null;
            }

            octets.push(octet);
        }

        return octets;
    }

    function ipInRange(ip, cidr) {
        var ipOctets = parseIp(ip);
        var fullBytes;
        var remainingBits;
        var mask;

        if (!ipOctets) {
            return false;
        }

        if (cidr.type === "single") {
            return ipOctets.join(".") === cidr.ipOctets.join(".");
        }

        fullBytes = Math.floor(cidr.prefix / 8);
        remainingBits = cidr.prefix % 8;

        for (var i = 0; i < fullBytes; i++) {
            if (ipOctets[i] !== cidr.networkOctets[i]) {
                return false;
            }
        }

        if (remainingBits === 0) {
            return true;
        }

        mask = (0xff << (8 - remainingBits)) & 0xff;
        return (ipOctets[fullBytes] & mask) === (cidr.networkOctets[fullBytes] & mask);
    }

    function getObfuscatedIp(ip, cidr) {
        var ipOctets = parseIp(ip);

        if (!ipOctets) {
            return ip;
        }

        var lastOctet = ipOctets[3];

        return "1.2.3." + lastOctet;
    }
}());