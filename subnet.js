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

// UI utilities
function updateDisplay(elementId, octets) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerHTML = octets.map((octet, i) => 
        `<span class="octet octet-${i + 1}">${octet}</span>`
    ).join('.');
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
    // Remove non-numeric characters
    e.target.value = e.target.value.replace(/\D/g, '');
    
    const value = e.target.value;
    const nextInput = document.getElementById(`octet-${index + 1}`);
    
    // Auto-advance to next input
    if (value.length >= 3 && nextInput && validateOctet(value)) {
        nextInput.focus();
    }
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
function calculateSubnet() {
    // Gather inputs
    const ipOctets = Array.from({length: 4}, (_, i) => {
        const input = document.getElementById(`octet-${i + 1}`);
        return parseInt(input?.value || '0');
    });
    
    const prefixInput = document.getElementById('prefix-input');
    const prefix = parseInt(prefixInput?.value || '24');
    
    // Validate inputs
    if (!ipOctets.every(validateOctet) || !validatePrefix(prefix)) {
        alert('Please enter valid values for IP address and subnet prefix');
        return;
    }
    
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
    
    // Set up calculate button
    const calculateBtn = document.getElementById('visualize-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateSubnet);
    }
    
    // Handle Enter key on any input
    const allInputs = [
        ...Array.from({length: 4}, (_, i) => document.getElementById(`octet-${i + 1}`)),
        document.getElementById('prefix-input')
    ].filter(Boolean);
    
    allInputs.forEach(input => {
        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') calculateSubnet();
        });
    });
});