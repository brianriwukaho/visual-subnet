// Subnet calculation utilities
function calculateSubnetMask(prefix) {
    const binaryMask = '1'.repeat(prefix) + '0'.repeat(32 - prefix);
    const octets = [];
    for (let i = 0; i < 32; i += 8) {
        octets.push(parseInt(binaryMask.substring(i, i + 8), 2));
    }
    return octets;
}

function calculateNetworkAddress(ipOctets, maskOctets) {
    return ipOctets.map((octet, i) => octet & maskOctets[i]);
}

function calculateBroadcastAddress(networkOctets, maskOctets) {
    return networkOctets.map((octet, i) => octet | (~maskOctets[i] & 255));
}

function calculateAddresses(prefix) {
    const total = Math.pow(2, 32 - prefix);
    return {
        total,
        usable: total > 2 ? total - 2 : 0
    };
}

// Binary conversion utilities
function octetToBinary(octet) {
    return octet.toString(2).padStart(8, '0').split('');
}

function octetsToBinary(octets) {
    return octets.map(octet => octetToBinary(octet));
}

// UI utilities
function updateBinaryDisplay(elementId, octets) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const binaryArrays = octetsToBinary(octets);
    element.innerHTML = binaryArrays.map((bits, octetIndex) => 
        `<div class="binary-octet octet-${octetIndex + 1}">
            ${bits.map((bit, bitIndex) => 
                `<span class="bit">${bit}</span>${(bitIndex + 1) % 4 === 0 && bitIndex < 7 ? '<span class="bit-separator"></span>' : ''}`
            ).join('')}
        </div>`
    ).join('<div class="octet-separator">.</div>');
}

function updateDisplay(elementId, octets) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const binaryArrays = octetsToBinary(octets);
    element.innerHTML = binaryArrays.map((bits, octetIndex) => 
        `<div class="binary-octet octet-${octetIndex + 1}">
            ${bits.map((bit, bitIndex) => 
                `<span class="bit ${bit === '1' ? 'bit-one' : 'bit-zero'}">${bit}</span>${(bitIndex + 1) % 4 === 0 && bitIndex < 7 ? '<span class="bit-separator"></span>' : ''}`
            ).join('')}
        </div>`
    ).join('');
}

function updateText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = text;
}

function validateOctet(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 255;
}

function validatePrefix(value) {
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 32;
}

// Event handlers
function handleOctetInput(e, index) {
    // Remove non-numeric characters and limit to 3 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    e.target.value = value;
    
    const nextInput = document.getElementById(`octet-${index + 1}`);
    
    // Auto-advance to next input if valid
    if (value.length === 3 && nextInput && validateOctet(value)) {
        nextInput.focus();
    }
    
    // Recalculate everything
    calculateAndUpdateAll();
}

function handleKeyNavigation(e, index) {
    const prevInput = document.getElementById(`octet-${index - 1}`);
    const nextInput = document.getElementById(`octet-${index + 1}`);
    const prefixInput = document.getElementById('prefix-input');
    
    if (e.key === '.' && nextInput) {
        e.preventDefault();
        nextInput.focus();
    } else if (e.key === 'Backspace' && !e.target.value && prevInput) {
        e.preventDefault();
        prevInput.focus();
    } else if (e.key === '/' && !nextInput && prefixInput) {
        e.preventDefault();
        prefixInput.focus();
    }
}

// Main calculation function
function calculateAndUpdateAll() {
    // Gather inputs
    const ipOctets = Array.from({length: 4}, (_, i) => {
        const input = document.getElementById(`octet-${i + 1}`);
        return parseInt(input?.value || '0');
    });
    
    const prefixInput = document.getElementById('prefix-input');
    const prefix = parseInt(prefixInput?.value || '24');
    
    // Validate inputs
    if (!ipOctets.every(validateOctet) || !validatePrefix(prefix)) {
        return;
    }
    
    // Calculate subnet information
    const maskOctets = calculateSubnetMask(prefix);
    const networkOctets = calculateNetworkAddress(ipOctets, maskOctets);
    const broadcastOctets = calculateBroadcastAddress(networkOctets, maskOctets);
    const { total, usable } = calculateAddresses(prefix);
    
    // Update displays
    updateBinaryDisplay('ip-binary-display', ipOctets);
    updateBinaryDisplay('subnet-mask-binary-display', maskOctets);
    updateDisplay('ip-display', ipOctets);
    updateDisplay('subnet-mask-display', maskOctets);
    updateText('cidr-prefix', prefix);
    updateText('network-address', networkOctets.join('.'));
    updateText('broadcast-address', broadcastOctets.join('.'));
    updateText('address-count', total.toLocaleString());
    updateText('usable-count', usable.toLocaleString());
    
    // Show results
    const resultDiv = document.getElementById('result');
    if (resultDiv) resultDiv.classList.remove('hidden');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up input event listeners
    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`octet-${i}`);
        if (input) {
            input.addEventListener('input', e => handleOctetInput(e, i));
            input.addEventListener('keydown', e => handleKeyNavigation(e, i));
        }
    }
    
    // Set up prefix input listener
    const prefixInput = document.getElementById('prefix-input');
    if (prefixInput) {
        prefixInput.addEventListener('input', calculateAndUpdateAll);
    }
    
    // Initial calculation
    calculateAndUpdateAll();
});