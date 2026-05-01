const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'staff', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startIndex = content.indexOf('{/* Add Student Modal / Onboarding Flow */}');
if (startIndex === -1) {
    console.error("Could not find start index.");
    process.exit(1);
}

// Find the last closing div of the return statement.
// The file structure ends with:
//         </div>
//     );
// }
const endMatch = content.match(/<\/div>\s*\);\s*}\s*$/);
if (!endMatch) {
    console.error("Could not find end match.");
    process.exit(1);
}
const endOfDiv = endMatch.index;

const modalContent = content.substring(startIndex, endOfDiv);
// Find the exact end of the modal block which is `)}`
const lastClosingIndex = startIndex + modalContent.lastIndexOf(')}');

const newModal = `            {/* Add Student Modal / Onboarding Flow */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetOnboardModal} />
                    <div className="relative w-full max-w-6xl h-[90vh] bg-[#f8fafc] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                        
                        {/* Header */}
                        <div className="bg-white border-b border-slate-200 shrink-0">
                            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-indigo-600 font-medium cursor-pointer" onClick={resetOnboardModal}>Students</span>
                                    <span className="text-slate-400">&gt;</span>
                                    <span className="text-slate-600 font-medium">
                                        {onboardStep === 1 ? 'New Applicant' : \`\${newStudent.firstName} \${newStudent.lastName}\`}
                                    </span>
                                </div>
                                <button onClick={resetOnboardModal} className="p-2 text-slate-400 hover:text-slate-900 transition-all">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                            
                            {onboardStep >= 2 && (
                                <div className="px-6 py-4 flex items-center gap-6">
                                    {/* Profile summary card */}
                                    <div className="flex items-center gap-4 bg-white border border-slate-200 p-3 rounded-xl shadow-sm min-w-[250px]">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                                            {newStudent.firstName?.[0] || ''}{newStudent.lastName?.[0] || ''}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{newStudent.firstName} {newStudent.lastName}</div>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-[12px]">mail</span> {newStudent.email}</div>
                                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><span className="material-symbols-outlined text-[12px]">call</span> {newStudent.mobile}</div>
                                        </div>
                                    </div>
                                    
                                    <button className="flex flex-col items-center justify-center border border-slate-200 bg-white rounded-xl p-3 shadow-sm hover:bg-slate-50 transition-all text-indigo-600 min-w-[100px]">
                                        <span className="material-symbols-outlined mb-1">share</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Platform Link</span>
                                    </button>

                                    {/* Progress Stepper */}
                                    <div className="flex-1 flex items-center justify-center gap-8 pl-8 border-l border-slate-200">
                                        <div className="flex flex-col items-center gap-2 relative cursor-pointer" onClick={() => setOnboardStep(2)}>
                                            <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-sm \${onboardStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}\`}>1</div>
                                            <div className={\`text-[11px] font-bold uppercase tracking-widest \${onboardStep >= 2 ? 'text-slate-700' : 'text-slate-400'}\`}>Profile</div>
                                            <div className={\`absolute top-4 left-8 w-24 h-[2px] -z-0 \${onboardStep >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}\`}></div>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 relative cursor-pointer" onClick={() => { if(onboardStep >= 2) setOnboardStep(3) }}>
                                            <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-sm \${onboardStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}\`}>2</div>
                                            <div className={\`text-[11px] font-bold uppercase tracking-widest \${onboardStep >= 3 ? 'text-slate-700' : 'text-slate-400'}\`}>Documents</div>
                                            <div className={\`absolute top-4 left-8 w-24 h-[2px] -z-0 \${onboardStep >= 4 ? 'bg-emerald-500' : 'bg-slate-200'}\`}></div>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 relative">
                                            <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 shadow-sm \${onboardStep >= 4 ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}\`}>3</div>
                                            <div className={\`text-[11px] font-bold uppercase tracking-widest \${onboardStep >= 4 ? 'text-slate-700' : 'text-slate-400'}\`}>Applications</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {onboardStep === 2 && (
                                <div className="px-6 flex items-center gap-8 border-t border-slate-100 overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'personal', label: 'Personal Information', status: 'Incomplete', color: 'text-rose-500' },
                                        { id: 'academic', label: 'Academic Qualifications', status: 'Incomplete', color: 'text-rose-500' },
                                        { id: 'work', label: 'Work Experience', status: 'Optional', color: 'text-amber-500' },
                                        { id: 'tests', label: 'Tests', status: 'Incomplete', color: 'text-rose-500' }
                                    ].map(tab => (
                                        <button 
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setProfileTab(tab.id as any)}
                                            className={\`py-4 flex flex-col items-center gap-1 border-b-2 transition-all shrink-0 \${profileTab === tab.id ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-600 hover:text-slate-900'}\`}
                                        >
                                            <span className="text-xs font-bold">{tab.label}</span>
                                            <span className={\`text-[10px] font-semibold \${profileTab === tab.id ? '' : tab.color}\`}>{tab.status}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 relative">
                            {onboardStep === 1 ? (
                                /* STEP 1: Quick Register */
                                <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mt-12 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="material-symbols-outlined text-[32px]">person_add</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900">Register New Applicant</h2>
                                        <p className="text-slate-500 mt-2 text-sm">Create an account to start their application profile</p>
                                    </div>
                                    <form id="quick-register-form" onSubmit={handleQuickRegister} className="space-y-5">
                                        <div className="grid grid-cols-2 gap-5">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">First Name*</label>
                                                <input required type="text" value={quickForm.firstName} onChange={e => setQuickForm({ ...quickForm, firstName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" placeholder="First Name" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Last Name*</label>
                                                <input required type="text" value={quickForm.lastName} onChange={e => setQuickForm({ ...quickForm, lastName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" placeholder="Last Name" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email Address*</label>
                                            <input required type="email" value={quickForm.email} onChange={e => setQuickForm({ ...quickForm, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" placeholder="Email Address" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Mobile Number*</label>
                                            <input required type="tel" value={quickForm.phone} onChange={e => setQuickForm({ ...quickForm, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium" placeholder="Phone Number" />
                                        </div>
                                    </form>
                                </div>
                            ) : onboardStep === 2 ? (
                                /* STEP 2: Full Profile */
                                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
                                    
                                    {/* Auto-fill banner */}
                                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                                <span className="material-symbols-outlined">magic_button</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">Autofill student details</h4>
                                                <p className="text-xs text-slate-500">Fill student profile in just few minutes.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-md">14 Student Autofills left</span>
                                            <button type="button" onClick={() => setOnboardStep(3)} className="text-xs font-bold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-all flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                                                Upload Documents
                                            </button>
                                        </div>
                                    </div>

                                    {profileTab === 'personal' && (
                                        <form id="profile-personal-form" onSubmit={handleSaveProfile} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">person</span>
                                                    Personal Information
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">First Name*</label>
                                                        <input required type="text" value={newStudent.firstName} onChange={e => setNewStudent({ ...newStudent, firstName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Middle Name</label>
                                                        <input type="text" value={newStudent.middleName} onChange={e => setNewStudent({ ...newStudent, middleName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Middle Name" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Last Name*</label>
                                                        <input required type="text" value={newStudent.lastName} onChange={e => setNewStudent({ ...newStudent, lastName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email Address*</label>
                                                        <input required type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Mobile Number*</label>
                                                        <div className="flex gap-2">
                                                            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex items-center gap-2">🇮🇳 +91</div>
                                                            <input required type="tel" value={newStudent.mobile} onChange={e => setNewStudent({ ...newStudent, mobile: e.target.value })} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Date of Birth*</label>
                                                        <input required type="date" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Gender*</label>
                                                        <select required value={newStudent.gender} onChange={e => setNewStudent({ ...newStudent, gender: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none text-slate-600">
                                                            <option value="">Select Gender</option>
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Marital Status*</label>
                                                        <select required value={newStudent.maritalStatus} onChange={e => setNewStudent({ ...newStudent, maritalStatus: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none text-slate-600">
                                                            <option value="">Select Marital Status</option>
                                                            <option value="single">Single</option>
                                                            <option value="married">Married</option>
                                                            <option value="divorced">Divorced</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">location_on</span>
                                                    Mailing Address
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 1*</label>
                                                        <input type="text" value={newStudent.mailingAddress.address1} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address1: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Address" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 2</label>
                                                        <input type="text" value={newStudent.mailingAddress.address2} onChange={e => setNewStudent({ ...newStudent, mailingAddress: { ...newStudent.mailingAddress, address2: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Address" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Country</option><option>India</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State*</label>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select State</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City*</label>
                                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter City" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Pincode*</label>
                                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Pincode" />
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>
                                            
                                            <section>
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                                        <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">location_on</span>
                                                        Permanent Address
                                                    </div>
                                                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                                                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                                                        Same as mailing address
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 1*</label>
                                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Address" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Address 2</label>
                                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium" placeholder="Enter Address" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country*</label>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Country</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State*</label>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select State</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City*</label>
                                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter City" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Pincode*</label>
                                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Pincode" />
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">badge</span>
                                                    Passport Information
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Passport Number*</label>
                                                        <input type="text" value={newStudent.passport.number} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, number: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter Number" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Issue Date*</label>
                                                        <input type="date" value={newStudent.passport.issueDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, issueDate: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Expiry Date*</label>
                                                        <input type="date" value={newStudent.passport.expiryDate} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, expiryDate: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-600" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Issue Country*</label>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Issue Country</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Birth*</label>
                                                        <input type="text" value={newStudent.passport.birthCity} onChange={e => setNewStudent({ ...newStudent, passport: { ...newStudent.passport, birthCity: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Enter City" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Birth*</label>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Country of Birth</option></select>
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">public</span>
                                                    Nationality
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Nationality*</label>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Nationality</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Citizenship*</label>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Citizenship</option></select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-700 mb-2 block">Is the applicant a citizen of more than one country?*</label>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                <input type="radio" name="dualCitizen" className="w-4 h-4 text-emerald-500" defaultChecked /> No
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                <input type="radio" name="dualCitizen" className="w-4 h-4 text-emerald-500" /> Yes
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none opacity-50" disabled><option>Enter Nationality</option></select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                    <div>
                                                        <label className="text-[10px] font-black text-slate-700 mb-2 block">Is the applicant living and studying in any other country?*</label>
                                                        <div className="flex gap-4">
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                <input type="radio" name="livingOther" className="w-4 h-4 text-emerald-500" defaultChecked /> No
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                                                                <input type="radio" name="livingOther" className="w-4 h-4 text-emerald-500" /> Yes
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none opacity-50" disabled><option>Select Living Country</option></select>
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">info</span>
                                                    Background Info
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Has applicant applied for any type of immigration into any country?</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"><input type="radio" name="bgImmigration" className="w-4 h-4 text-emerald-500" defaultChecked /> No</label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"><input type="radio" name="bgImmigration" className="w-4 h-4 text-emerald-500" /> Yes</label>
                                                            </div>
                                                        </div>
                                                        <div><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none opacity-50" disabled><option>Select Country</option></select></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Does applicant suffer from a serious medical condition?</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"><input type="radio" name="bgMedical" className="w-4 h-4 text-emerald-500" defaultChecked /> No</label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"><input type="radio" name="bgMedical" className="w-4 h-4 text-emerald-500" /> Yes</label>
                                                            </div>
                                                        </div>
                                                        <div><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm opacity-50" placeholder="Specify Here..." disabled /></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Has applicant Visa refusal for any country?</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"><input type="radio" name="bgVisa" className="w-4 h-4 text-emerald-500" defaultChecked /> No</label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"><input type="radio" name="bgVisa" className="w-4 h-4 text-emerald-500" /> Yes</label>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none opacity-50" disabled><option>Select Country</option></select>
                                                            <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm opacity-50" placeholder="Type of Visa" disabled />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-[10px] font-black text-slate-700 mb-2 block">Has applicant ever been convicted of a criminal offence?</label>
                                                            <div className="flex gap-4">
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"><input type="radio" name="bgCrime" className="w-4 h-4 text-emerald-500" defaultChecked /> No</label>
                                                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"><input type="radio" name="bgCrime" className="w-4 h-4 text-emerald-500" /> Yes</label>
                                                            </div>
                                                        </div>
                                                        <div><input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm opacity-50" placeholder="Specify Here..." disabled /></div>
                                                    </div>
                                                </div>
                                            </section>

                                            <div className="h-px bg-slate-100 my-8"></div>

                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">contact_emergency</span>
                                                    Important Contacts
                                                </div>
                                                <div className="mb-4">
                                                    <label className="text-[12px] font-black text-slate-900 block">Emergency Contacts</label>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name*</label>
                                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Name" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Phone*</label>
                                                        <div className="flex gap-2">
                                                            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm flex items-center gap-2">🇮🇳 +91</div>
                                                            <input type="tel" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Mobile Number" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Email*</label>
                                                        <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Email Address" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Relation with Applicant*</label>
                                                        <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Relation" />
                                                    </div>
                                                </div>
                                            </section>
                                        </form>
                                    )}

                                    {profileTab === 'academic' && (
                                        <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                                            <section>
                                                <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">school</span>
                                                    Education Summary
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Education*</label>
                                                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>India</option></select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Highest Level of Education*</label>
                                                        <select value={newStudent.academic.highestLevel} onChange={e => setNewStudent({ ...newStudent, academic: { ...newStudent.academic, highestLevel: e.target.value } })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium appearance-none">
                                                            <option value="">Select Level</option>
                                                            <option value="Postgraduate">Postgraduate</option>
                                                            <option value="Undergraduate">Undergraduate</option>
                                                            <option value="Grade 12">Grade 12 or equivalent</option>
                                                            <option value="Grade 10">Grade 10 or equivalent</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </section>

                                            {(newStudent.academic.highestLevel === 'Postgraduate') && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-8"></div>
                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">workspace_premium</span>
                                                            Post Graduate
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Country</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select State</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Level of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Postgraduate</option></select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of University*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Name of University" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Qualification Achieved/Degree Awarded</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Qualification Achieved / Degree Awarded" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter City of Study" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select...</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Percentage*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Percentage" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Primary Language of Instruction" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-lg">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 flex justify-center md:justify-start">
                                                            <button type="button" className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                        </div>
                                                    </section>
                                                </>
                                            )}

                                            {(['Postgraduate', 'Undergraduate'].includes(newStudent.academic.highestLevel)) && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-8"></div>
                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">menu_book</span>
                                                            Undergraduate
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Country</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select State</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Level of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Undergraduate</option></select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of University*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Name of University" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Qualification Achieved/Degree Awarded</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Qualification Achieved / Degree Awarded" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter City of Study" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select...</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Score(UG)*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Score" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Primary Language of Instruction" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Backlogs</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Backlogs" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 flex justify-center md:justify-start">
                                                            <button type="button" className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                        </div>
                                                    </section>
                                                </>
                                            )}

                                            {(['Postgraduate', 'Undergraduate', 'Grade 12'].includes(newStudent.academic.highestLevel)) && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-8"></div>
                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">school</span>
                                                            Grade 12th or equivalent education
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Country</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select State</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Level of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Grade 12th or equivalent</option></select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of Board*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Name of Board" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Qualification Achieved/Degree Awarded</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Qualification Achieved / Degree Awarded" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of the institution*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Name of the institution" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter City of Study" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select...</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Score(12th)*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Score" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Primary Language of Instruction" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-lg">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 flex justify-center md:justify-start">
                                                            <button type="button" className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                        </div>
                                                    </section>
                                                </>
                                            )}

                                            {(['Postgraduate', 'Undergraduate', 'Grade 12', 'Grade 10'].includes(newStudent.academic.highestLevel)) && (
                                                <>
                                                    <div className="h-px bg-slate-100 my-8"></div>
                                                    <section>
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-sm">
                                                            <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 p-1 rounded-full">school</span>
                                                            Grade 10th or equivalent
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Country of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select Country</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">State of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select State</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Level of Study*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Grade 10th or equivalent</option></select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of Board*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Name of Board" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Qualification Achieved/Degree Awarded</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Qualification Achieved / Degree Awarded" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Name of the institution*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Name of the institution" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">City of Study*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter City of Study" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Grading System*</label>
                                                                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none"><option>Select...</option></select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Score(10th)*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Score" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Primary Language of Instruction*</label>
                                                                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Enter Primary Language of Instruction" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-lg">
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Start Date*</label>
                                                                <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">End Date*</label>
                                                                <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-6 flex justify-center md:justify-start">
                                                            <button type="button" className="px-10 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20">Save</button>
                                                        </div>
                                                        <div className="mt-8 flex justify-center border-t border-dashed border-slate-200 pt-6">
                                                            <button type="button" className="flex items-center gap-2 text-emerald-600 text-sm font-bold hover:text-emerald-700 transition-all">
                                                                <span className="material-symbols-outlined text-white bg-emerald-500 rounded-full text-[16px] p-0.5">add</span>
                                                                Add Another
                                                            </button>
                                                        </div>
                                                    </section>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Action buttons fixed at bottom */}
                                    <div className="sticky bottom-0 mt-8 py-4 bg-[#f8fafc] border-t border-slate-200 flex justify-between items-center z-10">
                                        <button type="button" onClick={resetOnboardModal} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-all">Cancel</button>
                                        <div className="flex gap-4">
                                            {onboardStep === 2 && profileTab === 'personal' && (
                                                <button form="profile-personal-form" type="submit" disabled={createLoading} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50">
                                                    {createLoading ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            )}
                                            {onboardStep === 2 && profileTab === 'academic' && (
                                                <button type="button" onClick={() => setOnboardStep(3)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                                                    Proceed to Documents
                                                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : onboardStep === 3 ? (
                                /* STEP 3: Documents */
                                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-12 mt-4">
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                        <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[24px]">folder_open</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Applicant Documents</h3>
                                                <p className="text-xs text-slate-500">Upload the required proofs based on the profile data.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {[
                                                { name: "Passport (Front & Back)", required: true },
                                                { name: "10th Marksheet", required: true },
                                                { name: "12th Marksheet", required: newStudent.academic.highestLevel !== 'Grade 10' },
                                                { name: "Undergraduate Transcript", required: ['Undergraduate', 'Postgraduate'].includes(newStudent.academic.highestLevel) },
                                                { name: "Postgraduate Transcript", required: newStudent.academic.highestLevel === 'Postgraduate' },
                                                { name: "Resume / CV", required: true },
                                            ].filter(doc => doc.required).map((doc, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-outlined text-[20px]">description</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                                                            <p className="text-[10px] uppercase tracking-widest text-rose-500 font-bold mt-0.5">Required</p>
                                                        </div>
                                                    </div>
                                                    <button className="px-5 py-2.5 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[16px]">upload</span>
                                                        Upload
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="sticky bottom-0 mt-8 py-4 bg-[#f8fafc] border-t border-slate-200 flex justify-between items-center z-10">
                                        <button type="button" onClick={() => setOnboardStep(2)} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-all flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                            Back to Profile
                                        </button>
                                        <button type="button" onClick={resetOnboardModal} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                                            Complete Onboarding
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        
                        {/* Step 1 Footer */}
                        {onboardStep === 1 && (
                            <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-4 shrink-0">
                                <button type="button" onClick={resetOnboardModal} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-all border border-slate-200 rounded-xl">Cancel</button>
                                <button form="quick-register-form" type="submit" disabled={createLoading} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2">
                                    {createLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Register Applicant"}
                                    {!createLoading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
`;

content = content.substring(0, startIndex) + newModal + "\n" + content.substring(endOfDiv);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Modal replaced successfully.');
