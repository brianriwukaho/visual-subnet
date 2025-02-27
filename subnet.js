/**
 * IPv4SubnetCalculator - A module to handle IPv4 subnet calculations
 * Responsible for all subnet mathematics and conversions
 */
class IPv4SubnetCalculator {
    /**
     * Parse a CIDR notation string into its IP and prefix components
     * @param {string} cidrNotation - IP address in CIDR notation (e.g., "192.168.1.0/24")
     * @returns {Object} Object containing IP octets and prefix
     */
    parseCIDR(cidrNotation) {
        const [ipAddress, prefixStr] = cidrNotation.split('/');
        return {
            octets: ipAddress.split('.').map(Number),
            prefix: parseInt(prefixStr)
        };
    }
    
    /**
     * Validate a CIDR notation string
     * @param {string} cidr - IP address in CIDR notation
     * @returns {boolean} Whether the CIDR notation is valid
     */
    isValid(cidr) {
        const pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;
        if (!pattern.test(cidr)) return false;
        
        const { octets, prefix } = this.parseCIDR(cidr);
        
        // Check each octet is between 0 and 255
        if (octets.some(octet => octet < 0 || octet > 255)) return false;
        
        // Check prefix is between 0 and 32
        if (prefix < 0 || prefix > 32) return false;
        
        return true;
    }
    
    /**
     * Calculate subnet mask from prefix length
     * @param {number} prefix - CIDR prefix length
     * @returns {number[]} Array of subnet mask octets
     */
    calculateSubnetMaskOctets(prefix) {
        // Create a 32-bit binary string with '1's for network and '0's for host portions
        let binaryMask = '1'.repeat(prefix) + '0'.repeat(32 - prefix);
        
        // Split into octets and convert to decimal
        const octets = [];
        for (let i = 0; i < 32; i += 8) {
            const octet = binaryMask.substring(i, i + 8);
            octets.push(parseInt(octet, 2));
        }
        
        return octets;
    }
    
    /**
     * Calculate network address from IP and subnet mask
     * @param {number[]} ipOctets - Array of IP address octets
     * @param {number[]} maskOctets - Array of subnet mask octets
     * @returns {number[]} Network address octets
     */
    calculateNetworkOctets(ipOctets, maskOctets) {
        return ipOctets.map((octet, index) => octet & maskOctets[index]);
    }
    
    /**
     * Calculate broadcast address from network address and subnet mask
     * @param {number[]} networkOctets - Array of network address octets
     * @param {number[]} maskOctets - Array of subnet mask octets
     * @returns {number[]} Broadcast address octets
     */
    calculateBroadcastOctets(networkOctets, maskOctets) {
        return networkOctets.map((octet, index) => octet | (~maskOctets[index] & 255));
    }
    
    /**
     * Calculate address counts from prefix
     * @param {number} prefix - CIDR prefix length
     * @returns {Object} Total and usable address counts
     */
    calculateAddressCounts(prefix) {
        const total = Math.pow(2, 32 - prefix);
        const usable = total > 2 ? total - 2 : 0;
        
        return { total, usable };
    }
    
    /**
     * Convert array of octets to dot-notation string
     * @param {number[]} octets - Array of octets
     * @returns {string} Dot-notation string
     */
    octetsToDotNotation(octets) {
        return octets.join('.');
    }
    
    /**
     * Perform complete subnet calculation based on CIDR notation
     * @param {string} cidrNotation - IP address in CIDR notation
     * @returns {Object|null} Complete subnet information or null if invalid
     */
    calculateSubnet(cidrNotation) {
        if (!this.isValid(cidrNotation)) {
            return null;
        }
        
        const { octets: ipOctets, prefix } = this.parseCIDR(cidrNotation);
        const maskOctets = this.calculateSubnetMaskOctets(prefix);
        const networkOctets = this.calculateNetworkOctets(ipOctets, maskOctets);
        const broadcastOctets = this.calculateBroadcastOctets(networkOctets, maskOctets);
        const { total: totalAddresses, usable: usableAddresses } = this.calculateAddressCounts(prefix);
        
        return {
            ipOctets,
            maskOctets,
            networkOctets,
            broadcastOctets,
            prefix,
            totalAddresses,
            usableAddresses
        };
    }
}

/**
 * SubnetVisualizer - A module to handle the UI aspects of subnet visualization
 * Responsible for DOM manipulation and user interaction
 */
class SubnetVisualizer {
    constructor() {
        this.calculator = new IPv4SubnetCalculator();
        this.initializeElements();
        this.bindEvents();
        this.loadDefaultExample();
    }
    
    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.cidrInput = document.getElementById('cidr-input');
        this.visualizeBtn = document.getElementById('visualize-btn');
        this.resultDiv = document.getElementById('result');
        
        // IP Display elements
        this.ipDisplay = document.getElementById('ip-display');
        this.subnetMaskDisplay = document.getElementById('subnet-mask-display');
        this.cidrPrefixElement = document.getElementById('cidr-prefix');
        this.networkAddressElement = document.getElementById('network-address');
        this.broadcastAddressElement = document.getElementById('broadcast-address');
        this.addressCountElement = document.getElementById('address-count');
        this.usableCountElement = document.getElementById('usable-count');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        this.visualizeBtn.addEventListener('click', () => this.visualizeSubnet());
        this.cidrInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.visualizeSubnet();
            }
        });
    }
    
    /**
     * Load a default example on page load
     */
    loadDefaultExample() {
        this.cidrInput.value = '192.168.1.0/24';
        this.visualizeSubnet();
    }
    
    /**
     * Display an octet array in a DOM element with proper styling
     * @param {HTMLElement} displayElement - Element to update
     * @param {number[]} octets - Array of octets to display
     */
    updateIpDisplay(displayElement, octets) {
        // Clear previous content
        displayElement.innerHTML = '';
        
        // Create and append each octet with the appropriate styling
        octets.forEach((octet, index) => {
            const octetSpan = document.createElement('span');
            octetSpan.textContent = octet;
            octetSpan.className = `octet octet-${index + 1}`;
            displayElement.appendChild(octetSpan);
            
            // Add dot separator except after the last octet
            if (index < octets.length - 1) {
                const dot = document.createTextNode('.');
                displayElement.appendChild(dot);
            }
        });
    }
    
    /**
     * Main function to visualize subnet from user input
     */
    visualizeSubnet() {
        const cidrNotation = this.cidrInput.value.trim();
        
        const subnetInfo = this.calculator.calculateSubnet(cidrNotation);
        if (!subnetInfo) {
            alert('Please enter a valid IPv4 address in CIDR notation (e.g., 192.168.1.0/24)');
            return;
        }
        
        // Update the UI with subnet information
        this.updateDisplayWithSubnetInfo(subnetInfo);
        
        // Show result
        this.resultDiv.classList.remove('hidden');
    }
    
    /**
     * Update the UI with calculated subnet information
     * @param {Object} subnetInfo - Object containing subnet information
     */
    updateDisplayWithSubnetInfo(subnetInfo) {
        const { 
            ipOctets, 
            maskOctets, 
            networkOctets, 
            broadcastOctets, 
            prefix, 
            totalAddresses, 
            usableAddresses 
        } = subnetInfo;
        
        // Update IP displays with colored octets
        this.updateIpDisplay(this.ipDisplay, ipOctets);
        this.updateIpDisplay(this.subnetMaskDisplay, maskOctets);
        
        // Update text displays
        this.cidrPrefixElement.textContent = prefix;
        this.networkAddressElement.textContent = this.calculator.octetsToDotNotation(networkOctets);
        this.broadcastAddressElement.textContent = this.calculator.octetsToDotNotation(broadcastOctets);
        this.addressCountElement.textContent = totalAddresses.toLocaleString();
        this.usableCountElement.textContent = usableAddresses.toLocaleString();
    }
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new SubnetVisualizer();
});