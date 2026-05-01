const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'staff', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change setIsAddModalOpen(true) to setActiveSection('onboarding')
content = content.replace(/setIsAddModalOpen\(true\)/g, "setActiveSection('onboarding')");

// 2. Change resetOnboardModal function to also setActiveSection('overview')
const resetModalMatch = content.match(/const resetOnboardModal = \(\) => \{[\s\S]*?\};/);
if (resetModalMatch) {
    let resetModalStr = resetModalMatch[0];
    resetModalStr = resetModalStr.replace(/setIsAddModalOpen\(false\);/, "setActiveSection('overview');");
    content = content.replace(resetModalMatch[0], resetModalStr);
}

// 3. Extract the onboarding UI and inject it into the activeSections.
const startIndex = content.indexOf('{/* Add Student Modal / Onboarding Flow */}');
if (startIndex !== -1) {
    // Find end of file
    const endMatch = content.match(/<\/div>\s*\);\s*}\s*$/);
    const endOfDiv = endMatch.index;

    let modalContent = content.substring(startIndex, endOfDiv);
    
    // We need to strip the modal wrappers:
    // {isAddModalOpen && (
    //     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    //         <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetOnboardModal} />
    //         <div className="relative w-full max-w-6xl h-[90vh] bg-[#f8fafc] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
    // ...
    //         </div>
    //     </div>
    // )}

    // Let's just find the inner content starting at {/* Header */}
    const headerStart = modalContent.indexOf('{/* Header */}');
    // And ends before the Step 1 Footer closing divs
    const step1FooterStart = modalContent.indexOf('{/* Step 1 Footer */}');
    const footerContent = modalContent.substring(step1FooterStart);
    const lastClosingDivs = footerContent.lastIndexOf('</div>\n                </div>\n            )}');
    
    // We rebuild the view
    let innerUI = modalContent.substring(headerStart, step1FooterStart + lastClosingDivs).trim();
    // remove the last two </div> if we need to. Actually, it's easier to just do a regex replace on the wrapper.

    // Let's replace the whole modal block with nothing
    content = content.substring(0, startIndex) + content.substring(endOfDiv);

    // And insert the onboarding view where other activeSections are:
    const insertPoint = content.indexOf('{/* Applicant Profiles */}');
    
    const onboardingView = `
                    {/* Onboarding Flow View */}
                    {activeSection === "onboarding" && (
                        <div className="flex flex-col h-full bg-[#f8fafc] rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
                            ${innerUI}
                        </div>
                    )}
                    
`;
    content = content.substring(0, insertPoint) + onboardingView + content.substring(insertPoint);
}

// Also update the activeSection condition so that the main container padding is removed for onboarding view to make it full width
content = content.replace(/activeSection\.startsWith\('chat_'\) \? 'p-0' : 'p-6 lg:p-8 space-y-6'/, "(activeSection.startsWith('chat_') || activeSection === 'onboarding') ? 'p-0' : 'p-6 lg:p-8 space-y-6'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Converted modal to full-width view successfully.');
