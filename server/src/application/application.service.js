"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationService = void 0;
var common_1 = require("@nestjs/common");
// Application stages with descriptions and order
var APPLICATION_STAGES = {
    application_submitted: { order: 1, label: 'Application Submitted', progress: 10 },
    document_verification: { order: 2, label: 'Document Verification', progress: 30 },
    credit_check: { order: 3, label: 'Credit Check', progress: 50 },
    bank_review: { order: 4, label: 'Bank Review', progress: 70 },
    sanction: { order: 5, label: 'Sanction', progress: 90 },
    disbursement: { order: 6, label: 'Disbursement', progress: 100 },
};
// Required documents by loan type
var REQUIRED_DOCUMENTS = {
    education: [
        { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/Passport)', isRequired: true },
        { docType: 'address_proof', docName: 'Address Proof', isRequired: true },
        { docType: 'photo', docName: 'Passport Size Photo', isRequired: true },
        { docType: 'admission_letter', docName: 'Admission Letter', isRequired: true },
        { docType: 'fee_structure', docName: 'Fee Structure', isRequired: true },
        { docType: 'academic_records', docName: '10th & 12th Marksheets', isRequired: true },
        { docType: 'income_proof', docName: 'Co-Applicant Income Proof', isRequired: false },
        { docType: 'bank_statement', docName: 'Bank Statements (6 months)', isRequired: false },
    ],
    home: [
        { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/PAN)', isRequired: true },
        { docType: 'address_proof', docName: 'Address Proof', isRequired: true },
        { docType: 'income_proof', docName: 'Income Proof', isRequired: true },
        { docType: 'bank_statement', docName: 'Bank Statements (6 months)', isRequired: true },
        { docType: 'property_documents', docName: 'Property Documents', isRequired: true },
        { docType: 'salary_slips', docName: 'Salary Slips (3 months)', isRequired: true },
    ],
    personal: [
        { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/PAN)', isRequired: true },
        { docType: 'address_proof', docName: 'Address Proof', isRequired: true },
        { docType: 'income_proof', docName: 'Income Proof', isRequired: true },
        { docType: 'bank_statement', docName: 'Bank Statements (3 months)', isRequired: true },
    ],
    business: [
        { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/PAN)', isRequired: true },
        { docType: 'address_proof', docName: 'Business Address Proof', isRequired: true },
        { docType: 'business_registration', docName: 'Business Registration', isRequired: true },
        { docType: 'financial_statements', docName: 'Financial Statements', isRequired: true },
        { docType: 'bank_statement', docName: 'Bank Statements (12 months)', isRequired: true },
        { docType: 'itr', docName: 'ITR (3 years)', isRequired: true },
    ],
    vehicle: [
        { docType: 'identity_proof', docName: 'Identity Proof (Aadhar/PAN)', isRequired: true },
        { docType: 'address_proof', docName: 'Address Proof', isRequired: true },
        { docType: 'income_proof', docName: 'Income Proof', isRequired: true },
        { docType: 'bank_statement', docName: 'Bank Statements (3 months)', isRequired: true },
        { docType: 'vehicle_quotation', docName: 'Vehicle Quotation', isRequired: true },
    ],
};
var ApplicationService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ApplicationService = _classThis = /** @class */ (function () {
        function ApplicationService_1(prisma) {
            this.prisma = prisma;
        }
        // ==================== APPLICATION CRUD ====================
        /**
         * Create a new loan application
         */
        ApplicationService_1.prototype.createApplication = function (userId, data) {
            return __awaiter(this, void 0, void 0, function () {
                var phoneDigits, fPhoneDigits, mPhoneDigits, applicationNumber, estimatedCompletionAt, application, error_1;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 4, , 5]);
                            console.log('[ApplicationService] Creating application for user:', userId);
                            // Validation logic
                            if (!data.firstName || data.firstName.length < 3) {
                                throw new common_1.BadRequestException('First name must be at least 3 characters long');
                            }
                            if (!data.lastName || data.lastName.length < 1) {
                                throw new common_1.BadRequestException('Last name must be at least 1 character long');
                            }
                            phoneDigits = ((_a = data.phone) === null || _a === void 0 ? void 0 : _a.replace(/[^0-9]/g, '')) || '';
                            if (phoneDigits.length !== 10) {
                                throw new common_1.BadRequestException('Phone number must be exactly 10 digits');
                            }
                            // Parent Details Validation (if provided)
                            if (data.fatherName && data.fatherName.length < 3) {
                                throw new common_1.BadRequestException('Father\'s name must be at least 3 characters long');
                            }
                            if (data.fatherPhone) {
                                fPhoneDigits = data.fatherPhone.replace(/[^0-9]/g, '');
                                if (fPhoneDigits.length !== 10) {
                                    throw new common_1.BadRequestException('Father\'s phone number must be exactly 10 digits');
                                }
                            }
                            if (data.motherName && data.motherName.length < 3) {
                                throw new common_1.BadRequestException('Mother\'s name must be at least 3 characters long');
                            }
                            if (data.motherPhone) {
                                mPhoneDigits = data.motherPhone.replace(/[^0-9]/g, '');
                                if (mPhoneDigits.length !== 10) {
                                    throw new common_1.BadRequestException('Mother\'s phone number must be exactly 10 digits');
                                }
                            }
                            applicationNumber = this.generateApplicationNumber(data.loanType);
                            estimatedCompletionAt = new Date();
                            estimatedCompletionAt.setDate(estimatedCompletionAt.getDate() + 14);
                            return [4 /*yield*/, this.prisma.loanApplication.create({
                                    data: {
                                        applicationNumber: applicationNumber,
                                        userId: userId,
                                        bank: data.bank || 'HDFC Credila',
                                        loanType: data.loanType || 'education',
                                        amount: data.amount ? parseFloat(data.amount.toString()) : 0,
                                        tenure: data.tenure ? parseInt(data.tenure.toString()) : null,
                                        purpose: data.purpose,
                                        // Applicant Details
                                        firstName: data.firstName,
                                        lastName: data.lastName,
                                        email: data.email,
                                        phone: data.phone,
                                        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                                        gender: data.gender,
                                        nationality: data.nationality,
                                        // Address
                                        address: data.address,
                                        city: data.city,
                                        state: data.state,
                                        pincode: data.pincode,
                                        country: data.country,
                                        // Employment
                                        employmentType: data.employmentType,
                                        employerName: data.employerName,
                                        jobTitle: data.jobTitle,
                                        annualIncome: data.annualIncome ? parseFloat(data.annualIncome.toString()) : null,
                                        workExperience: data.workExperience ? parseInt(data.workExperience.toString()) : null,
                                        // Education specific
                                        universityName: data.universityName,
                                        courseName: data.courseName,
                                        courseDuration: data.courseDuration ? parseInt(data.courseDuration.toString()) : null,
                                        courseStartDate: data.courseStartDate ? new Date(data.courseStartDate) : null,
                                        admissionStatus: data.admissionStatus,
                                        // Co-Applicant
                                        hasCoApplicant: data.hasCoApplicant || false,
                                        coApplicantName: data.coApplicantName,
                                        coApplicantRelation: data.coApplicantRelation,
                                        coApplicantPhone: data.coApplicantPhone,
                                        coApplicantEmail: data.coApplicantEmail,
                                        coApplicantIncome: data.coApplicantIncome ? parseFloat(data.coApplicantIncome.toString()) : null,
                                        // Parent Details
                                        fatherName: data.fatherName,
                                        fatherPhone: data.fatherPhone,
                                        fatherEmail: data.fatherEmail,
                                        motherName: data.motherName,
                                        motherPhone: data.motherPhone,
                                        motherEmail: data.motherEmail,
                                        // Collateral
                                        hasCollateral: data.hasCollateral || false,
                                        collateralType: data.collateralType,
                                        collateralValue: data.collateralValue ? parseFloat(data.collateralValue.toString()) : null,
                                        collateralDetails: data.collateralDetails,
                                        // Status
                                        status: data.status || 'draft',
                                        stage: 'application_submitted',
                                        progress: 10,
                                        estimatedCompletionAt: estimatedCompletionAt,
                                    },
                                    include: {
                                        user: {
                                            select: { id: true, email: true, firstName: true, lastName: true }
                                        }
                                    }
                                })];
                        case 1:
                            application = _b.sent();
                            // Create initial status history
                            return [4 /*yield*/, this.createStatusHistory(application.id, {
                                    toStatus: application.status,
                                    toStage: application.stage,
                                    notes: 'Application created',
                                    isAutomatic: true,
                                })];
                        case 2:
                            // Create initial status history
                            _b.sent();
                            // Initialize required documents based on loan type
                            return [4 /*yield*/, this.initializeRequiredDocuments(application.id, data.loanType || 'education')];
                        case 3:
                            // Initialize required documents based on loan type
                            _b.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: application,
                                    message: 'Application created successfully'
                                }];
                        case 4:
                            error_1 = _b.sent();
                            console.error('[ApplicationService] Error in createApplication:', error_1);
                            throw error_1;
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Submit a draft application
         */
        ApplicationService_1.prototype.submitApplication = function (applicationId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var application, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getApplicationById(applicationId)];
                        case 1:
                            application = _a.sent();
                            if (application.userId !== userId) {
                                throw new common_1.BadRequestException('Unauthorized to submit this application');
                            }
                            if (application.status !== 'draft') {
                                throw new common_1.BadRequestException('Only draft applications can be submitted');
                            }
                            return [4 /*yield*/, this.prisma.loanApplication.update({
                                    where: { id: applicationId },
                                    data: {
                                        status: 'submitted',
                                        submittedAt: new Date(),
                                        progress: 15,
                                    },
                                    include: {
                                        documents: true,
                                        statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 }
                                    }
                                })];
                        case 2:
                            updated = _a.sent();
                            return [4 /*yield*/, this.createStatusHistory(applicationId, {
                                    fromStatus: 'draft',
                                    toStatus: 'submitted',
                                    notes: 'Application submitted for review',
                                    isAutomatic: true,
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: updated,
                                    message: 'Application submitted successfully'
                                }];
                    }
                });
            });
        };
        /**
         * Get application by ID
         */
        ApplicationService_1.prototype.getApplicationById = function (applicationId) {
            return __awaiter(this, void 0, void 0, function () {
                var application;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.loanApplication.findUnique({
                                where: { id: applicationId },
                                include: {
                                    user: {
                                        select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true }
                                    },
                                    documents: {
                                        orderBy: { uploadedAt: 'desc' }
                                    },
                                    statusHistory: {
                                        orderBy: { createdAt: 'desc' }
                                    },
                                    notes: {
                                        where: { isInternal: false },
                                        orderBy: { createdAt: 'desc' }
                                    }
                                }
                            })];
                        case 1:
                            application = _a.sent();
                            if (!application) {
                                throw new common_1.NotFoundException('Application not found');
                            }
                            return [2 /*return*/, application];
                    }
                });
            });
        };
        /**
         * Get application by application number
         */
        ApplicationService_1.prototype.getApplicationByNumber = function (applicationNumber) {
            return __awaiter(this, void 0, void 0, function () {
                var application;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.loanApplication.findUnique({
                                where: { applicationNumber: applicationNumber },
                                include: {
                                    user: {
                                        select: { id: true, email: true, firstName: true, lastName: true }
                                    },
                                    documents: true,
                                    statusHistory: {
                                        orderBy: { createdAt: 'desc' }
                                    }
                                }
                            })];
                        case 1:
                            application = _a.sent();
                            if (!application) {
                                throw new common_1.NotFoundException('Application not found');
                            }
                            return [2 /*return*/, application];
                    }
                });
            });
        };
        /**
         * Get all applications for a user
         */
        ApplicationService_1.prototype.getUserApplications = function (userId, filters) {
            return __awaiter(this, void 0, void 0, function () {
                var where, _a, applications, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            where = { userId: userId };
                            if (filters === null || filters === void 0 ? void 0 : filters.status) {
                                where.status = filters.status;
                            }
                            if (filters === null || filters === void 0 ? void 0 : filters.loanType) {
                                where.loanType = filters.loanType;
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.loanApplication.findMany({
                                        where: where,
                                        include: {
                                            documents: true
                                        },
                                        orderBy: { date: 'desc' },
                                        take: (filters === null || filters === void 0 ? void 0 : filters.limit) || 20,
                                        skip: (filters === null || filters === void 0 ? void 0 : filters.offset) || 0,
                                    }),
                                    this.prisma.loanApplication.count({ where: where })
                                ])];
                        case 1:
                            _a = _b.sent(), applications = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: applications,
                                    pagination: {
                                        total: total,
                                        limit: (filters === null || filters === void 0 ? void 0 : filters.limit) || 20,
                                        offset: (filters === null || filters === void 0 ? void 0 : filters.offset) || 0
                                    }
                                }];
                    }
                });
            });
        };
        /**
         * Update application
         */
        ApplicationService_1.prototype.updateApplication = function (applicationId, userId, data) {
            return __awaiter(this, void 0, void 0, function () {
                var application, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getApplicationById(applicationId)];
                        case 1:
                            application = _a.sent();
                            if (application.userId !== userId) {
                                throw new common_1.BadRequestException('Unauthorized to update this application');
                            }
                            if (!['draft', 'documents_pending'].includes(application.status)) {
                                throw new common_1.BadRequestException('Application cannot be modified in current status');
                            }
                            return [4 /*yield*/, this.prisma.loanApplication.update({
                                    where: { id: applicationId },
                                    data: __assign(__assign({}, data), { amount: data.amount ? parseFloat(data.amount) : undefined, tenure: data.tenure ? parseInt(data.tenure) : undefined, annualIncome: data.annualIncome ? parseFloat(data.annualIncome) : undefined, dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined, courseStartDate: data.courseStartDate ? new Date(data.courseStartDate) : undefined }),
                                    include: {
                                        documents: true
                                    }
                                })];
                        case 2:
                            updated = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: updated,
                                    message: 'Application updated successfully'
                                }];
                    }
                });
            });
        };
        /**
         * Cancel application
         */
        ApplicationService_1.prototype.cancelApplication = function (applicationId, userId, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var application, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getApplicationById(applicationId)];
                        case 1:
                            application = _a.sent();
                            if (application.userId !== userId) {
                                throw new common_1.BadRequestException('Unauthorized to cancel this application');
                            }
                            if (['approved', 'disbursed', 'cancelled'].includes(application.status)) {
                                throw new common_1.BadRequestException('Application cannot be cancelled in current status');
                            }
                            return [4 /*yield*/, this.prisma.loanApplication.update({
                                    where: { id: applicationId },
                                    data: {
                                        status: 'cancelled',
                                        remarks: reason,
                                    }
                                })];
                        case 2:
                            updated = _a.sent();
                            return [4 /*yield*/, this.createStatusHistory(applicationId, {
                                    fromStatus: application.status,
                                    toStatus: 'cancelled',
                                    notes: reason || 'Application cancelled by user',
                                    isAutomatic: false,
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: updated,
                                    message: 'Application cancelled successfully'
                                }];
                    }
                });
            });
        };
        /**
         * Delete application
         */
        ApplicationService_1.prototype.deleteApplication = function (applicationId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var application;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getApplicationById(applicationId)];
                        case 1:
                            application = _a.sent();
                            if (application.userId !== userId) {
                                throw new common_1.BadRequestException('Unauthorized to delete this application');
                            }
                            // Optional: restriction on status, e.g. can only delete if draft/cancelled/rejected
                            // For now allowing deletion regardless of status as per request, but good to be mindful.
                            // Delete related records
                            // Prisma cascade delete might handle this if configured, but explicit deletion is safer if relationships vary
                            // 1. Delete documents
                            return [4 /*yield*/, this.prisma.applicationDocument.deleteMany({
                                    where: { applicationId: applicationId }
                                })];
                        case 2:
                            // Optional: restriction on status, e.g. can only delete if draft/cancelled/rejected
                            // For now allowing deletion regardless of status as per request, but good to be mindful.
                            // Delete related records
                            // Prisma cascade delete might handle this if configured, but explicit deletion is safer if relationships vary
                            // 1. Delete documents
                            _a.sent();
                            // 2. Delete notes
                            return [4 /*yield*/, this.prisma.applicationNote.deleteMany({
                                    where: { applicationId: applicationId }
                                })];
                        case 3:
                            // 2. Delete notes
                            _a.sent();
                            // 3. Delete status history
                            return [4 /*yield*/, this.prisma.applicationStatusHistory.deleteMany({
                                    where: { applicationId: applicationId }
                                })];
                        case 4:
                            // 3. Delete status history
                            _a.sent();
                            // 4. Delete application
                            return [4 /*yield*/, this.prisma.loanApplication.delete({
                                    where: { id: applicationId }
                                })];
                        case 5:
                            // 4. Delete application
                            _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    message: 'Application deleted successfully'
                                }];
                    }
                });
            });
        };
        // ==================== APPLICATION TRACKING ====================
        /**
         * Get application timeline/tracking info
         */
        ApplicationService_1.prototype.getApplicationTracking = function (applicationId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var application, stages, documentsStatus;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.loanApplication.findUnique({
                                where: { id: applicationId },
                                include: {
                                    statusHistory: {
                                        orderBy: { createdAt: 'asc' }
                                    },
                                    documents: true
                                }
                            })];
                        case 1:
                            application = _a.sent();
                            if (!application) {
                                throw new common_1.NotFoundException('Application not found');
                            }
                            // If userId provided, verify ownership
                            if (userId && application.userId !== userId) {
                                throw new common_1.BadRequestException('Unauthorized to view this application');
                            }
                            stages = Object.entries(APPLICATION_STAGES).map(function (_a) {
                                var _b, _c;
                                var key = _a[0], value = _a[1];
                                var currentStageOrder = ((_b = APPLICATION_STAGES[application.stage]) === null || _b === void 0 ? void 0 : _b.order) || 0;
                                var isCompleted = value.order < currentStageOrder;
                                var isCurrent = key === application.stage;
                                return {
                                    key: key,
                                    label: value.label,
                                    order: value.order,
                                    isCompleted: isCompleted,
                                    isCurrent: isCurrent,
                                    completedAt: isCompleted
                                        ? (_c = application.statusHistory.find(function (h) { return h.toStage === key; })) === null || _c === void 0 ? void 0 : _c.createdAt
                                        : null
                                };
                            });
                            documentsStatus = {
                                total: application.documents.length,
                                pending: application.documents.filter(function (d) { return d.status === 'pending'; }).length,
                                verified: application.documents.filter(function (d) { return d.status === 'verified'; }).length,
                                rejected: application.documents.filter(function (d) { return d.status === 'rejected'; }).length,
                            };
                            return [2 /*return*/, {
                                    success: true,
                                    data: {
                                        applicationId: application.id,
                                        applicationNumber: application.applicationNumber,
                                        status: application.status,
                                        currentStage: application.stage,
                                        progress: application.progress,
                                        stages: stages,
                                        timeline: application.statusHistory,
                                        documents: documentsStatus,
                                        estimatedCompletion: application.estimatedCompletionAt,
                                        submittedAt: application.submittedAt,
                                        lastUpdated: application.updatedAt,
                                    }
                                }];
                    }
                });
            });
        };
        /**
         * Track application by application number (public)
         */
        ApplicationService_1.prototype.trackApplication = function (applicationNumber) {
            return __awaiter(this, void 0, void 0, function () {
                var application, stages;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.loanApplication.findUnique({
                                where: { applicationNumber: applicationNumber },
                                select: {
                                    id: true,
                                    applicationNumber: true,
                                    loanType: true,
                                    bank: true,
                                    amount: true,
                                    status: true,
                                    stage: true,
                                    progress: true,
                                    submittedAt: true,
                                    estimatedCompletionAt: true,
                                    updatedAt: true,
                                }
                            })];
                        case 1:
                            application = _a.sent();
                            if (!application) {
                                throw new common_1.NotFoundException('Application not found');
                            }
                            stages = Object.entries(APPLICATION_STAGES).map(function (_a) {
                                var _b;
                                var key = _a[0], value = _a[1];
                                var currentStageOrder = ((_b = APPLICATION_STAGES[application.stage]) === null || _b === void 0 ? void 0 : _b.order) || 0;
                                return {
                                    key: key,
                                    label: value.label,
                                    order: value.order,
                                    isCompleted: value.order < currentStageOrder,
                                    isCurrent: key === application.stage,
                                };
                            });
                            return [2 /*return*/, {
                                    success: true,
                                    data: __assign(__assign({}, application), { stages: stages })
                                }];
                    }
                });
            });
        };
        // ==================== DOCUMENT MANAGEMENT ====================
        /**
         * Initialize required documents for an application
         */
        ApplicationService_1.prototype.initializeRequiredDocuments = function (applicationId, loanType) {
            return __awaiter(this, void 0, void 0, function () {
                var requiredDocs, _i, requiredDocs_1, doc;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            requiredDocs = REQUIRED_DOCUMENTS[loanType] || REQUIRED_DOCUMENTS.personal;
                            _i = 0, requiredDocs_1 = requiredDocs;
                            _a.label = 1;
                        case 1:
                            if (!(_i < requiredDocs_1.length)) return [3 /*break*/, 4];
                            doc = requiredDocs_1[_i];
                            return [4 /*yield*/, this.prisma.applicationDocument.create({
                                    data: {
                                        applicationId: applicationId,
                                        docType: doc.docType,
                                        docName: doc.docName,
                                        fileName: '',
                                        filePath: '',
                                        status: 'pending',
                                        isRequired: doc.isRequired,
                                    }
                                })];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Upload document to application
         */
        ApplicationService_1.prototype.uploadDocument = function (applicationId, userId, documentData) {
            return __awaiter(this, void 0, void 0, function () {
                var application, existingDoc, document;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getApplicationById(applicationId)];
                        case 1:
                            application = _a.sent();
                            if (application.userId !== userId) {
                                throw new common_1.BadRequestException('Unauthorized to upload documents');
                            }
                            return [4 /*yield*/, this.prisma.applicationDocument.findFirst({
                                    where: {
                                        applicationId: applicationId,
                                        docType: documentData.docType
                                    }
                                })];
                        case 2:
                            existingDoc = _a.sent();
                            if (!existingDoc) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.prisma.applicationDocument.update({
                                    where: { id: existingDoc.id },
                                    data: {
                                        fileName: documentData.fileName,
                                        filePath: documentData.filePath,
                                        fileSize: documentData.fileSize,
                                        mimeType: documentData.mimeType,
                                        status: 'pending',
                                        uploadedAt: new Date(),
                                    }
                                })];
                        case 3:
                            // Update existing document
                            document = _a.sent();
                            return [3 /*break*/, 6];
                        case 4: return [4 /*yield*/, this.prisma.applicationDocument.create({
                                data: __assign(__assign({ applicationId: applicationId }, documentData), { status: 'pending' })
                            })];
                        case 5:
                            // Create new document
                            document = _a.sent();
                            _a.label = 6;
                        case 6: return [2 /*return*/, {
                                success: true,
                                data: document,
                                message: 'Document uploaded successfully'
                            }];
                    }
                });
            });
        };
        /**
         * Get documents for an application
         */
        ApplicationService_1.prototype.getApplicationDocuments = function (applicationId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var application, documents, grouped;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!userId) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.getApplicationById(applicationId)];
                        case 1:
                            application = _a.sent();
                            if (application.userId !== userId) {
                                throw new common_1.BadRequestException('Unauthorized to view documents');
                            }
                            _a.label = 2;
                        case 2: return [4 /*yield*/, this.prisma.applicationDocument.findMany({
                                where: { applicationId: applicationId },
                                orderBy: { uploadedAt: 'desc' }
                            })];
                        case 3:
                            documents = _a.sent();
                            grouped = {
                                pending: documents.filter(function (d) { return d.status === 'pending' && d.filePath; }),
                                verified: documents.filter(function (d) { return d.status === 'verified'; }),
                                rejected: documents.filter(function (d) { return d.status === 'rejected'; }),
                                notUploaded: documents.filter(function (d) { return !d.filePath; }),
                            };
                            return [2 /*return*/, {
                                    success: true,
                                    data: documents,
                                    grouped: grouped,
                                    summary: {
                                        total: documents.length,
                                        uploaded: documents.filter(function (d) { return d.filePath; }).length,
                                        pending: grouped.pending.length,
                                        verified: grouped.verified.length,
                                        rejected: grouped.rejected.length,
                                        notUploaded: grouped.notUploaded.length,
                                    }
                                }];
                    }
                });
            });
        };
        /**
         * Delete a document
         */
        ApplicationService_1.prototype.deleteDocument = function (documentId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var document;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.applicationDocument.findUnique({
                                where: { id: documentId },
                                include: { application: true }
                            })];
                        case 1:
                            document = _a.sent();
                            if (!document) {
                                throw new common_1.NotFoundException('Document not found');
                            }
                            if (document.application.userId !== userId) {
                                throw new common_1.BadRequestException('Unauthorized to delete this document');
                            }
                            if (document.status === 'verified') {
                                throw new common_1.BadRequestException('Verified documents cannot be deleted');
                            }
                            if (!document.isRequired) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.applicationDocument.update({
                                    where: { id: documentId },
                                    data: {
                                        fileName: '',
                                        filePath: '',
                                        fileSize: null,
                                        mimeType: null,
                                        status: 'pending',
                                    }
                                })];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 3: return [4 /*yield*/, this.prisma.applicationDocument.delete({
                                where: { id: documentId }
                            })];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5: return [2 /*return*/, {
                                success: true,
                                message: 'Document deleted successfully'
                            }];
                    }
                });
            });
        };
        // ==================== ADMIN OPERATIONS ====================
        /**
         * Get all applications (admin)
         */
        ApplicationService_1.prototype.getAllApplications = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var where, orderBy, _a, applications, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            where = {};
                            if (filters === null || filters === void 0 ? void 0 : filters.status)
                                where.status = filters.status;
                            if (filters === null || filters === void 0 ? void 0 : filters.stage)
                                where.stage = filters.stage;
                            if (filters === null || filters === void 0 ? void 0 : filters.loanType)
                                where.loanType = filters.loanType;
                            if (filters === null || filters === void 0 ? void 0 : filters.bank)
                                where.bank = filters.bank;
                            if (filters === null || filters === void 0 ? void 0 : filters.search) {
                                where.OR = [
                                    { applicationNumber: { contains: filters.search, mode: 'insensitive' } },
                                    { firstName: { contains: filters.search, mode: 'insensitive' } },
                                    { lastName: { contains: filters.search, mode: 'insensitive' } },
                                    { email: { contains: filters.search, mode: 'insensitive' } },
                                ];
                            }
                            if ((filters === null || filters === void 0 ? void 0 : filters.fromDate) || (filters === null || filters === void 0 ? void 0 : filters.toDate)) {
                                where.submittedAt = {};
                                if (filters.fromDate)
                                    where.submittedAt.gte = new Date(filters.fromDate);
                                if (filters.toDate)
                                    where.submittedAt.lte = new Date(filters.toDate);
                            }
                            orderBy = {};
                            orderBy[(filters === null || filters === void 0 ? void 0 : filters.sortBy) || 'date'] = (filters === null || filters === void 0 ? void 0 : filters.sortOrder) || 'desc';
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.loanApplication.findMany({
                                        where: where,
                                        include: {
                                            user: {
                                                select: { id: true, email: true, firstName: true, lastName: true }
                                            },
                                            documents: true
                                        },
                                        orderBy: orderBy,
                                        take: (filters === null || filters === void 0 ? void 0 : filters.limit) || 20,
                                        skip: (filters === null || filters === void 0 ? void 0 : filters.offset) || 0,
                                    }),
                                    this.prisma.loanApplication.count({ where: where })
                                ])];
                        case 1:
                            _a = _b.sent(), applications = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: applications,
                                    pagination: {
                                        total: total,
                                        limit: (filters === null || filters === void 0 ? void 0 : filters.limit) || 20,
                                        offset: (filters === null || filters === void 0 ? void 0 : filters.offset) || 0
                                    }
                                }];
                    }
                });
            });
        };
        /**
         * Update application status (admin)
         */
        ApplicationService_1.prototype.updateApplicationStatus = function (applicationId, adminId, adminName, data) {
            return __awaiter(this, void 0, void 0, function () {
                var application, updateData, historyData, updated;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.getApplicationById(applicationId)];
                        case 1:
                            application = _b.sent();
                            updateData = {};
                            historyData = {
                                changedBy: adminId,
                                changedByName: adminName,
                            };
                            if (data.status && data.status !== application.status) {
                                updateData.status = data.status;
                                historyData.fromStatus = application.status;
                                historyData.toStatus = data.status;
                                // Set timestamps based on status
                                if (data.status === 'under_review') {
                                    updateData.reviewStartedAt = new Date();
                                }
                                else if (data.status === 'approved') {
                                    updateData.approvedAt = new Date();
                                }
                                else if (data.status === 'rejected') {
                                    updateData.rejectedAt = new Date();
                                    updateData.rejectionReason = data.rejectionReason;
                                }
                                else if (data.status === 'disbursed') {
                                    updateData.disbursedAt = new Date();
                                }
                            }
                            if (data.stage && data.stage !== application.stage) {
                                updateData.stage = data.stage;
                                updateData.progress = ((_a = APPLICATION_STAGES[data.stage]) === null || _a === void 0 ? void 0 : _a.progress) || application.progress;
                                historyData.fromStage = application.stage;
                                historyData.toStage = data.stage;
                            }
                            if (data.progress !== undefined)
                                updateData.progress = data.progress;
                            if (data.remarks)
                                updateData.remarks = data.remarks;
                            if (data.assignedTo)
                                updateData.assignedTo = data.assignedTo;
                            if (data.sanctionAmount)
                                updateData.sanctionAmount = data.sanctionAmount;
                            if (data.sanctionedInterestRate)
                                updateData.sanctionedInterestRate = data.sanctionedInterestRate;
                            return [4 /*yield*/, this.prisma.loanApplication.update({
                                    where: { id: applicationId },
                                    data: updateData,
                                    include: {
                                        documents: true,
                                        statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 }
                                    }
                                })];
                        case 2:
                            updated = _b.sent();
                            if (!(data.status || data.stage)) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.createStatusHistory(applicationId, __assign(__assign({}, historyData), { notes: data.remarks }))];
                        case 3:
                            _b.sent();
                            _b.label = 4;
                        case 4: return [2 /*return*/, {
                                success: true,
                                data: updated,
                                message: 'Application updated successfully'
                            }];
                    }
                });
            });
        };
        /**
         * Verify document (admin)
         */
        ApplicationService_1.prototype.verifyDocument = function (documentId, adminId, data) {
            return __awaiter(this, void 0, void 0, function () {
                var document, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.applicationDocument.findUnique({
                                where: { id: documentId }
                            })];
                        case 1:
                            document = _a.sent();
                            if (!document) {
                                throw new common_1.NotFoundException('Document not found');
                            }
                            return [4 /*yield*/, this.prisma.applicationDocument.update({
                                    where: { id: documentId },
                                    data: {
                                        status: data.status,
                                        verifiedAt: data.status === 'verified' ? new Date() : null,
                                        verifiedBy: adminId,
                                        rejectionReason: data.rejectionReason,
                                    }
                                })];
                        case 2:
                            updated = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: updated,
                                    message: "Document ".concat(data.status, " successfully")
                                }];
                    }
                });
            });
        };
        /**
         * Add note to application (admin)
         */
        ApplicationService_1.prototype.addApplicationNote = function (applicationId, authorId, authorName, data) {
            return __awaiter(this, void 0, void 0, function () {
                var note;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.applicationNote.create({
                                data: {
                                    applicationId: applicationId,
                                    authorId: authorId,
                                    authorName: authorName,
                                    content: data.content,
                                    type: data.type || 'general',
                                    isInternal: data.isInternal || false,
                                }
                            })];
                        case 1:
                            note = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: note,
                                    message: 'Note added successfully'
                                }];
                    }
                });
            });
        };
        /**
         * Get application notes (admin)
         */
        ApplicationService_1.prototype.getApplicationNotes = function (applicationId_1) {
            return __awaiter(this, arguments, void 0, function (applicationId, includeInternal) {
                var where, notes;
                if (includeInternal === void 0) { includeInternal = true; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            where = { applicationId: applicationId };
                            if (!includeInternal) {
                                where.isInternal = false;
                            }
                            return [4 /*yield*/, this.prisma.applicationNote.findMany({
                                    where: where,
                                    orderBy: { createdAt: 'desc' }
                                })];
                        case 1:
                            notes = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: notes
                                }];
                    }
                });
            });
        };
        /**
         * Get application statistics (admin dashboard)
         */
        ApplicationService_1.prototype.getApplicationStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, total, byStatus, byLoanType, recentApplications, thisMonth, lastMonth, statusStats, loanTypeStats;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.loanApplication.count(),
                                this.prisma.loanApplication.groupBy({
                                    by: ['status'],
                                    _count: true
                                }),
                                this.prisma.loanApplication.groupBy({
                                    by: ['loanType'],
                                    _count: true,
                                    _sum: { amount: true }
                                }),
                                this.prisma.loanApplication.findMany({
                                    take: 5,
                                    orderBy: { date: 'desc' },
                                    select: {
                                        id: true,
                                        applicationNumber: true,
                                        loanType: true,
                                        amount: true,
                                        status: true,
                                        date: true,
                                        firstName: true,
                                        lastName: true,
                                    }
                                }),
                                this.prisma.loanApplication.count({
                                    where: {
                                        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                                    }
                                }),
                                this.prisma.loanApplication.count({
                                    where: {
                                        date: {
                                            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                                            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                        }
                                    }
                                }),
                            ])];
                        case 1:
                            _a = _b.sent(), total = _a[0], byStatus = _a[1], byLoanType = _a[2], recentApplications = _a[3], thisMonth = _a[4], lastMonth = _a[5];
                            statusStats = byStatus.reduce(function (acc, curr) {
                                acc[curr.status] = curr._count;
                                return acc;
                            }, {});
                            loanTypeStats = byLoanType.map(function (lt) { return ({
                                type: lt.loanType,
                                count: lt._count,
                                totalAmount: lt._sum.amount
                            }); });
                            return [2 /*return*/, {
                                    success: true,
                                    data: {
                                        total: total,
                                        statusStats: statusStats,
                                        loanTypeStats: loanTypeStats,
                                        recentApplications: recentApplications,
                                        monthlyComparison: {
                                            thisMonth: thisMonth,
                                            lastMonth: lastMonth,
                                            change: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0
                                        }
                                    }
                                }];
                    }
                });
            });
        };
        // ==================== HELPER METHODS ====================
        /**
         * Generate application number
         */
        ApplicationService_1.prototype.generateApplicationNumber = function (loanType) {
            var prefix = {
                education: 'EDU',
                home: 'HME',
                personal: 'PRS',
                business: 'BUS',
                vehicle: 'VEH',
            }[loanType] || 'APP';
            var timestamp = Date.now().toString(36).toUpperCase();
            var random = Math.random().toString(36).substring(2, 6).toUpperCase();
            return "".concat(prefix).concat(timestamp).concat(random);
        };
        /**
         * Create status history entry
         */
        ApplicationService_1.prototype.createStatusHistory = function (applicationId, data) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.applicationStatusHistory.create({
                            data: __assign({ applicationId: applicationId }, data)
                        })];
                });
            });
        };
        /**
         * Get required documents list for a loan type
         */
        ApplicationService_1.prototype.getRequiredDocuments = function (loanType) {
            return {
                success: true,
                data: REQUIRED_DOCUMENTS[loanType] || REQUIRED_DOCUMENTS.personal
            };
        };
        /**
         * Get application stages
         */
        ApplicationService_1.prototype.getApplicationStages = function () {
            return {
                success: true,
                data: APPLICATION_STAGES
            };
        };
        return ApplicationService_1;
    }());
    __setFunctionName(_classThis, "ApplicationService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ApplicationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ApplicationService = _classThis;
}();
exports.ApplicationService = ApplicationService;
