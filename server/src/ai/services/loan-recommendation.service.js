"use strict";
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanRecommendationService = void 0;
var common_1 = require("@nestjs/common");
var LoanRecommendationService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var LoanRecommendationService = _classThis = /** @class */ (function () {
        function LoanRecommendationService_1() {
            this.loanOffers = [
                {
                    id: 'aurora-student-core',
                    bank: 'Aurora Bank',
                    name: 'Global Scholar Starter Loan',
                    minScore: 55,
                    minCredit: 640,
                    minRatio: 0.8,
                    maxLoan: 85000,
                    requiresCoApplicant: true,
                    requiresCollateral: false,
                    apr: '10.2% - 12.9%',
                    coverage: 'Up to 85% of course cost',
                    bestFor: 'Undergraduate and masters students with co-applicant support.',
                },
                {
                    id: 'veridian-secured',
                    bank: 'Veridian Capital',
                    name: 'Secure Path Education Loan',
                    minScore: 60,
                    minCredit: 670,
                    minRatio: 0.9,
                    maxLoan: 180000,
                    requiresCoApplicant: false,
                    requiresCollateral: true,
                    apr: '8.8% - 11.4%',
                    coverage: 'Up to 95% of course cost',
                    bestFor: 'Higher loan amounts backed by collateral.',
                },
                {
                    id: 'summit-premier',
                    bank: 'Summit Federal',
                    name: 'Premier International Student Loan',
                    minScore: 70,
                    minCredit: 720,
                    minRatio: 1.1,
                    maxLoan: 220000,
                    requiresCoApplicant: false,
                    requiresCollateral: false,
                    apr: '8.1% - 10.5%',
                    coverage: 'Up to 90% of course cost',
                    bestFor: 'Strong credit profiles seeking competitive rates.',
                },
                {
                    id: 'nova-flex',
                    bank: 'Nova Learners Bank',
                    name: 'Flexi Study Loan',
                    minScore: 48,
                    minCredit: 610,
                    minRatio: 0.7,
                    maxLoan: 60000,
                    requiresCoApplicant: false,
                    requiresCollateral: false,
                    apr: '12.0% - 15.8%',
                    coverage: 'Up to 70% of course cost',
                    bestFor: 'Students needing smaller loan sizes with quick approvals.',
                },
                {
                    id: 'harbor-support',
                    bank: 'Harbor Trust',
                    name: 'Co-Applicant Advantage Loan',
                    minScore: 50,
                    minCredit: 630,
                    minRatio: 0.75,
                    maxLoan: 120000,
                    requiresCoApplicant: true,
                    requiresCollateral: false,
                    apr: '9.9% - 12.6%',
                    coverage: 'Up to 88% of course cost',
                    bestFor: 'Applicants with a reliable co-applicant and stable income.',
                },
            ];
        }
        LoanRecommendationService_1.prototype.recommendLoans = function (score, credit, ratio, loan, coApplicant, collateral, study) {
            var _this = this;
            var scored = this.loanOffers.map(function (offer) { return ({
                offer: offer,
                fit: _this.calculateOfferFit(offer, score, credit, ratio, loan, coApplicant, collateral, study),
            }); });
            scored.sort(function (a, b) { return b.fit - a.fit; });
            return {
                primary: scored[0],
                alternatives: scored.slice(1, 3),
            };
        };
        LoanRecommendationService_1.prototype.calculateOfferFit = function (offer, score, credit, ratio, loan, coApplicant, collateral, study) {
            var fit = 0;
            if (score >= offer.minScore) {
                fit += 25;
            }
            else {
                fit -= offer.minScore - score;
            }
            if (credit >= offer.minCredit) {
                fit += 20;
            }
            else {
                fit -= (offer.minCredit - credit) / 5;
            }
            if (ratio >= offer.minRatio) {
                fit += 20;
            }
            else {
                fit -= (offer.minRatio - ratio) * 40;
            }
            if (loan <= offer.maxLoan) {
                fit += 15;
            }
            else {
                fit -= (loan - offer.maxLoan) / 2000;
            }
            if (offer.requiresCoApplicant) {
                fit += coApplicant === 'yes' ? 10 : -20;
            }
            if (offer.requiresCollateral) {
                fit += collateral === 'yes' ? 10 : -20;
            }
            if (study === 'doctoral' || study === 'masters') {
                fit += 5;
            }
            return fit;
        };
        return LoanRecommendationService_1;
    }());
    __setFunctionName(_classThis, "LoanRecommendationService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        LoanRecommendationService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return LoanRecommendationService = _classThis;
}();
exports.LoanRecommendationService = LoanRecommendationService;
