/* 
 * 🧠 SynapseX Neural Console Shield v1.0
 * ---------------------------------------
 * # ENABLE SHIELD (PROTECT USERS): synapseShield.enable()
 * # DISABLE SHIELD (DEVELOPER MODE): synapseShield.disable()
 * ---------------------------------------
 * Professional DevTools Protection Layer
 * ---------------------------------------
 */

const SHIELD_CONFIG = {
    // 🟢 THE ONE LINE OPTION: Set to false to disable the console warning
    active: true,

    branding: "SynapseX",
    warningTitle: "🛑 STOP!",
    warningText: "This is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or 'hack' someone's account, it is a binary scam and will give them total access to your SynapseX identity.",
    actionText: "LEAVE FROM HERE IMMEDIATELY.",
    linkText: "Learn more at synapse-x.io/self-xss"
};

export const initializeConsoleShield = () => {
    // 🛡️ Internal State
    let shieldShown = false;

    // 🛠️ Developer Controller (Always Available)
    window.synapseShield = {
        enable: () => {
            localStorage.removeItem('synapse_dev_access');
            console.log("%c[Shield] Resonance restored. Protection re-enabling...", "color: #10b981; font-weight: bold;");
        },
        disable: () => {
            localStorage.setItem('synapse_dev_access', 'true');
            console.log("%c[Shield] Developer bypass active. Protection disabled.", "color: #10b981; font-weight: bold;");
        }
    };

    const printShield = () => {
        if (!SHIELD_CONFIG.active) return;

        const titleStyle = [
            "color: #10b981",
            "font-family: 'Inter', system-ui, sans-serif",
            "font-size: 60px",
            "font-weight: 800",
            "text-shadow: 0 0 20px rgba(16, 185, 129, 0.4)",
            "padding: 10px"
        ].join(";");

        const bodyStyle = [
            "color: #ffffff",
            "font-family: 'Inter', system-ui, sans-serif",
            "font-size: 20px",
            "line-height: 1.5",
            "font-weight: 500",
            "padding: 10px"
        ].join(";");

        const actionStyle = [
            "color: #ef4444",
            "font-family: 'Inter', system-ui, sans-serif",
            "font-size: 24px",
            "font-weight: 900",
            "padding: 10px",
            "text-transform: uppercase"
        ].join(";");

        const linkStyle = [
            "color: #10b981",
            "font-family: 'Inter', system-ui, sans-serif",
            "font-size: 14px",
            "text-decoration: underline",
            "padding: 10px",
            "opacity: 0.7"
        ].join(";");

        console.clear();
        console.log(`%c${SHIELD_CONFIG.warningTitle}`, titleStyle);
        console.log(`%c${SHIELD_CONFIG.warningText}`, bodyStyle);
        console.log(`%c${SHIELD_CONFIG.actionText}`, actionStyle);
        console.log(`%c${SHIELD_CONFIG.linkText}`, linkStyle);
    };

    // Dynamic Reinforcement Pulse (Reactive Shield)
    setInterval(() => {
        const currentlyBypassed = localStorage.getItem('synapse_dev_access') === 'true';
        const shouldShow = SHIELD_CONFIG.active && !currentlyBypassed;

        if (shouldShow && !shieldShown) {
            printShield();
            shieldShown = true;
        } else if (!shouldShow && shieldShown) {
            shieldShown = false;
        }
    }, 1000);

    // Initial check
    const isBypassed = localStorage.getItem('synapse_dev_access') === 'true';
    if (!isBypassed && SHIELD_CONFIG.active) {
        setTimeout(printShield, 500);
    }
};
