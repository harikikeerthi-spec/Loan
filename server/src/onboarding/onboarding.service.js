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
exports.OnboardingService = void 0;
var common_1 = require("@nestjs/common");
var OnboardingService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var OnboardingService = _classThis = /** @class */ (function () {
        function OnboardingService_1(supabase) {
            this.supabase = supabase;
        }
        Object.defineProperty(OnboardingService_1.prototype, "db", {
            get: function () {
                return this.supabase.getClient();
            },
            enumerable: false,
            configurable: true
        });
        OnboardingService_1.prototype.saveOnboardingData = function (data, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user_1, u, u, goalValue_1, countryValue_1, courseValue_1, targetUniValue_1, intakeValue_1, bachelorsValue_1, gpaValue_1, workExpValue_1, entranceTestValue_1, entranceScoreValue_1, englishTestValue_1, englishScoreValue_1, budgetValue_1, pincodeValue_1, loanAmountValue_1, admitStatusValue_1, updateData, _a, created, error, _b, updated, error, leadData, existingLead, error_1;
                var _this = this;
                var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
                return __generator(this, function (_u) {
                    switch (_u.label) {
                        case 0:
                            _u.trys.push([0, 15, , 16]);
                            if (!userId) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.db.from('User').select('*').eq('id', userId).single()];
                        case 1:
                            u = (_u.sent()).data;
                            user_1 = u;
                            return [3 /*break*/, 4];
                        case 2:
                            if (!data.email) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.db.from('User').select('*').eq('email', data.email).single()];
                        case 3:
                            u = (_u.sent()).data;
                            user_1 = u;
                            _u.label = 4;
                        case 4:
                            goalValue_1 = ((_c = data.goal) === null || _c === void 0 ? void 0 : _c.value) || data.goal || data.courseLevel;
                            countryValue_1 = ((_d = data.country) === null || _d === void 0 ? void 0 : _d.value) || data.studyDestination || data.study_destination;
                            courseValue_1 = ((_e = data.course) === null || _e === void 0 ? void 0 : _e.value) || data.courseName || data.course_name;
                            targetUniValue_1 = ((_f = data.target_university) === null || _f === void 0 ? void 0 : _f.label) || data.targetUniversity || data.target_university;
                            intakeValue_1 = ((_g = data.start_when) === null || _g === void 0 ? void 0 : _g.value) || data.intakeSeason || data.intake_season;
                            bachelorsValue_1 = ((_h = data.bachelors_degree) === null || _h === void 0 ? void 0 : _h.label) || data.bachelorsDegree || data.currentEducation;
                            gpaValue_1 = ((_j = data.gpa) === null || _j === void 0 ? void 0 : _j.value) ? parseFloat(data.gpa.value) : data.gpa ? parseFloat(data.gpa) : undefined;
                            workExpValue_1 = ((_k = data.work_exp) === null || _k === void 0 ? void 0 : _k.value)
                                ? parseInt(data.work_exp.value)
                                : data.workExperience
                                    ? parseInt(data.workExperience)
                                    : undefined;
                            entranceTestValue_1 = ((_l = data.entrance_test) === null || _l === void 0 ? void 0 : _l.value) || data.entranceTest;
                            entranceScoreValue_1 = ((_m = data.entrance_score) === null || _m === void 0 ? void 0 : _m.value) || data.entranceScore;
                            englishTestValue_1 = ((_o = data.english_test) === null || _o === void 0 ? void 0 : _o.value) || data.englishTest;
                            englishScoreValue_1 = ((_p = data.english_score) === null || _p === void 0 ? void 0 : _p.value) || data.englishScore;
                            budgetValue_1 = ((_q = data.study_budget) === null || _q === void 0 ? void 0 : _q.label) || data.budget || data.estimatedCost;
                            pincodeValue_1 = ((_r = data.loan_pincode) === null || _r === void 0 ? void 0 : _r.value) || data.pincode;
                            loanAmountValue_1 = ((_s = data.loan_amount) === null || _s === void 0 ? void 0 : _s.label) || data.loanAmount;
                            admitStatusValue_1 = ((_t = data.admit_status) === null || _t === void 0 ? void 0 : _t.value) || data.admitStatus;
                            updateData = {
                                firstName: data.firstName || (user_1 === null || user_1 === void 0 ? void 0 : user_1.firstName),
                                lastName: data.lastName || (user_1 === null || user_1 === void 0 ? void 0 : user_1.lastName),
                                phoneNumber: data.phone || data.phoneNumber || (user_1 === null || user_1 === void 0 ? void 0 : user_1.phoneNumber),
                                mobile: data.phone || data.phoneNumber || (user_1 === null || user_1 === void 0 ? void 0 : user_1.mobile),
                                goal: goalValue_1,
                                studyDestination: countryValue_1,
                                courseName: courseValue_1,
                                targetUniversity: targetUniValue_1,
                                intakeSeason: intakeValue_1,
                                bachelorsDegree: bachelorsValue_1,
                                workExp: workExpValue_1,
                                gpa: gpaValue_1,
                                entranceTest: entranceTestValue_1,
                                entranceScore: entranceScoreValue_1,
                                englishTest: englishTestValue_1,
                                englishScore: englishScoreValue_1,
                                budget: budgetValue_1,
                                pincode: pincodeValue_1,
                                loanAmount: loanAmountValue_1,
                                admitStatus: admitStatusValue_1,
                            };
                            if (!!user_1) return [3 /*break*/, 6];
                            if (!data.email)
                                return [2 /*return*/, { success: false, message: 'Email required for new user' }];
                            return [4 /*yield*/, this.db
                                    .from('User')
                                    .insert(__assign({ email: data.email, firstName: updateData.firstName || 'User', mobile: updateData.mobile || '', password: '', role: 'user' }, updateData))
                                    .select()
                                    .single()];
                        case 5:
                            _a = _u.sent(), created = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            user_1 = created;
                            return [3 /*break*/, 8];
                        case 6: return [4 /*yield*/, this.db
                                .from('User')
                                .update(updateData)
                                .eq('id', user_1.id)
                                .select()
                                .single()];
                        case 7:
                            _b = _u.sent(), updated = _b.data, error = _b.error;
                            if (error)
                                throw error;
                            user_1 = updated;
                            _u.label = 8;
                        case 8:
                            leadData = {
                                userId: user_1.id,
                                email: user_1.email,
                                fullName: updateData.firstName && updateData.lastName
                                    ? "".concat(updateData.firstName, " ").concat(updateData.lastName)
                                    : (user_1.firstName + ' ' + (user_1.lastName || '')).trim(),
                                phone: updateData.mobile,
                                goal: goalValue_1,
                                studyDestination: countryValue_1,
                                courseName: courseValue_1,
                                targetUniversity: targetUniValue_1,
                                intakeSeason: intakeValue_1,
                                bachelorsDegree: bachelorsValue_1,
                                gpa: gpaValue_1,
                                workExp: workExpValue_1,
                                entranceTest: entranceTestValue_1,
                                entranceScore: entranceScoreValue_1,
                                englishTest: englishTestValue_1,
                                englishScore: englishScoreValue_1,
                                budget: budgetValue_1,
                                pincode: pincodeValue_1,
                                loanAmount: loanAmountValue_1,
                                admitStatus: admitStatusValue_1,
                                source: 'onboarding_bot',
                                status: user_1.admitStatus ? 'processing' : 'pending',
                            };
                            return [4 /*yield*/, this.db.from('OnboardingApplication').select('id').eq('userId', user_1.id).single()];
                        case 9:
                            existingLead = (_u.sent()).data;
                            if (!existingLead) return [3 /*break*/, 11];
                            return [4 /*yield*/, this.db.from('OnboardingApplication').update(leadData).eq('userId', user_1.id)];
                        case 10:
                            _u.sent();
                            return [3 /*break*/, 13];
                        case 11: return [4 /*yield*/, this.db.from('OnboardingApplication').insert(leadData)];
                        case 12:
                            _u.sent();
                            _u.label = 13;
                        case 13: 
                        // Upsert study, academic, financial preferences
                        return [4 /*yield*/, Promise.all([
                                (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var existing, pref;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.db.from('UserStudyPreference').select('id').eq('userId', user_1.id).single()];
                                            case 1:
                                                existing = (_a.sent()).data;
                                                pref = { userId: user_1.id, goal: goalValue_1, studyDestination: countryValue_1, courseName: courseValue_1, targetUniversity: targetUniValue_1, intakeSeason: intakeValue_1, admitStatus: admitStatusValue_1 };
                                                if (!existing) return [3 /*break*/, 3];
                                                return [4 /*yield*/, this.db.from('UserStudyPreference').update(pref).eq('userId', user_1.id)];
                                            case 2:
                                                _a.sent();
                                                return [3 /*break*/, 5];
                                            case 3: return [4 /*yield*/, this.db.from('UserStudyPreference').insert(pref)];
                                            case 4:
                                                _a.sent();
                                                _a.label = 5;
                                            case 5: return [2 /*return*/];
                                        }
                                    });
                                }); })(),
                                (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var existing, prof;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.db.from('UserAcademicProfile').select('id').eq('userId', user_1.id).single()];
                                            case 1:
                                                existing = (_a.sent()).data;
                                                prof = { userId: user_1.id, bachelorsDegree: bachelorsValue_1, gpa: gpaValue_1, workExp: workExpValue_1, entranceTest: entranceTestValue_1, entranceScore: entranceScoreValue_1, englishTest: englishTestValue_1, englishScore: englishScoreValue_1 };
                                                if (!existing) return [3 /*break*/, 3];
                                                return [4 /*yield*/, this.db.from('UserAcademicProfile').update(prof).eq('userId', user_1.id)];
                                            case 2:
                                                _a.sent();
                                                return [3 /*break*/, 5];
                                            case 3: return [4 /*yield*/, this.db.from('UserAcademicProfile').insert(prof)];
                                            case 4:
                                                _a.sent();
                                                _a.label = 5;
                                            case 5: return [2 /*return*/];
                                        }
                                    });
                                }); })(),
                                (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var existing, fin;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.db.from('UserFinancialProfile').select('id').eq('userId', user_1.id).single()];
                                            case 1:
                                                existing = (_a.sent()).data;
                                                fin = { userId: user_1.id, budget: budgetValue_1, pincode: pincodeValue_1, loanAmount: loanAmountValue_1 };
                                                if (!existing) return [3 /*break*/, 3];
                                                return [4 /*yield*/, this.db.from('UserFinancialProfile').update(fin).eq('userId', user_1.id)];
                                            case 2:
                                                _a.sent();
                                                return [3 /*break*/, 5];
                                            case 3: return [4 /*yield*/, this.db.from('UserFinancialProfile').insert(fin)];
                                            case 4:
                                                _a.sent();
                                                _a.label = 5;
                                            case 5: return [2 /*return*/];
                                        }
                                    });
                                }); })(),
                            ])];
                        case 14:
                            // Upsert study, academic, financial preferences
                            _u.sent();
                            return [2 /*return*/, { success: true, message: 'Onboarding data saved successfully', user: user_1 }];
                        case 15:
                            error_1 = _u.sent();
                            console.error('Error saving onboarding data:', error_1);
                            return [2 /*return*/, { success: false, message: 'Failed to save onboarding data', error: error_1.message }];
                        case 16: return [2 /*return*/];
                    }
                });
            });
        };
        return OnboardingService_1;
    }());
    __setFunctionName(_classThis, "OnboardingService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OnboardingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OnboardingService = _classThis;
}();
exports.OnboardingService = OnboardingService;
