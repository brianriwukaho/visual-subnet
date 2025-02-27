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
function updateDisplay(elementId, octets) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const prefixInput = document.getElementById('prefix-input');
    const prefix = parseInt(prefixInput?.value || '24');
    
    const binaryArrays = octetsToBinary(octets);
    element.innerHTML = binaryArrays.map((bits, octetIndex) => {
        // For subnet mask display, we need to check if bits are used based on prefix
        const isSubnetMaskDisplay = elementId === 'subnet-mask-display';
        
        return `<div class="binary-octet">
            ${bits.map((bit, bitIndex) => {
                const bitPosition = octetIndex * 8 + bitIndex;
                
                // For subnet mask, determine the background color based on whether the bit is used
                let bitClass = 'bit';
                if (isSubnetMaskDisplay) {
                    // If this is a subnet mask and the bit position is less than prefix
                    if (bitPosition < prefix) {
                        // This is a used bit, color by original octet
                        bitClass += ` bit-used octet-${octetIndex + 1}`;
                    } else {
                        // This is an unused bit, use the prefix color
                        bitClass += ' bit-unused';
                    }
                } else {
                    // For IP address display, always use the octet's color
                    bitClass += ` octet-${octetIndex + 1}`;
                }
                
                return `<span class="${bitClass}">${bit}</span>${(bitIndex + 1) % 4 === 0 && bitIndex < 7 ? '<span class="bit-separator"></span>' : ''}`;
            }).join('')}
        </div>`;
    }).join('');
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

// Add handler for limiting prefix input to 2 digits
function handlePrefixInput(e) {
    // Remove non-numeric characters and limit to 2 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    e.target.value = value;
    
    // Ensure the value doesn't exceed 32
    if (parseInt(value, 10) > 32) {
        e.target.value = '32';
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

function updatePrefixInputColor() {
    const prefixInput = document.getElementById('prefix-input');
    if (!prefixInput) return;
    
    const prefix = parseInt(prefixInput.value || '24');
    const effectiveOctet = Math.floor(prefix / 8);
    
    // Remove any existing octet classes
    prefixInput.classList.remove('prefix-octet-1', 'prefix-octet-2', 'prefix-octet-3', 'prefix-octet-4');
    
    // Add the appropriate octet class
    if (prefix > 0) {
        prefixInput.classList.add(`prefix-octet-${effectiveOctet + 1}`);
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
    
    updatePrefixInputColor();
    
    // Calculate subnet information
    const maskOctets = calculateSubnetMask(prefix);
    const networkOctets = calculateNetworkAddress(ipOctets, maskOctets);
    const broadcastOctets = calculateBroadcastAddress(networkOctets, maskOctets);
    const { total, usable } = calculateAddresses(prefix);
    
    // Update displays
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
        prefixInput.addEventListener('input', handlePrefixInput);
    }
    
    // Initial calculation
    calculateAndUpdateAll();
});