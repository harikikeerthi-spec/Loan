import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class BankWorkflowAPI {
  private static instance = axios.create({
    baseURL: `${API_BASE}/api/bank/workflow`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Submit application to bank
   */
  static async submitToBank(data: {
    applicationId: string;
    bankId: string;
    bankName: string;
    submittedBy: string;
  }) {
    const response = await this.instance.post('/submit', data);
    return response.data;
  }

  /**
   * Log file with LAN number
   */
  static async logFile(
    submissionId: string,
    data: {
      lanNumber: string;
      loggedBy: string;
      notes?: string;
    },
  ) {
    const response = await this.instance.post(`/${submissionId}/log-file`, data);
    return response.data;
  }

  /**
   * Move to under review
   */
  static async moveToUnderReview(
    submissionId: string,
    data: {
      changedBy: string;
      notes?: string;
    },
  ) {
    const response = await this.instance.put(`/${submissionId}/under-review`, data);
    return response.data;
  }

  /**
   * Raise query
   */
  static async raiseQuery(
    submissionId: string,
    data: {
      queryType: string;
      queryDescription: string;
      raisedBy: string;
      dueDate?: string;
    },
  ) {
    const response = await this.instance.post(`/${submissionId}/query`, data);
    return response.data;
  }

  /**
   * Respond to query
   */
  static async respondToQuery(
    queryId: string,
    data: {
      response: string;
      respondedBy: string;
    },
  ) {
    const response = await this.instance.post(`/query/${queryId}/respond`, data);
    return response.data;
  }

  /**
   * Sanction application
   */
  static async sanctionApplication(
    submissionId: string,
    data: {
      sanctionAmount: number;
      roiType: string;
      roiBase: number;
      roiEffective: number;
      roiSubsidy?: number;
      tenure: number;
      decisionNotes?: string;
      decidedBy: string;
    },
  ) {
    const response = await this.instance.post(`/${submissionId}/sanction`, data);
    return response.data;
  }

  /**
   * Conditional sanction
   */
  static async conditionalSanctionApplication(
    submissionId: string,
    data: {
      sanctionAmount: number;
      roiType: string;
      roiBase: number;
      roiEffective: number;
      tenure: number;
      conditions: string[];
      decisionNotes?: string;
      decidedBy: string;
    },
  ) {
    const response = await this.instance.post(
      `/${submissionId}/conditional-sanction`,
      data,
    );
    return response.data;
  }

  /**
   * Make counter offer
   */
  static async makeCounterOffer(
    submissionId: string,
    data: {
      sanctionAmount: number;
      roiType: string;
      roiBase: number;
      roiEffective: number;
      tenure: number;
      terms: string;
      decidedBy: string;
    },
  ) {
    const response = await this.instance.post(
      `/${submissionId}/counter-offer`,
      data,
    );
    return response.data;
  }

  /**
   * Reject application
   */
  static async rejectApplication(
    submissionId: string,
    data: {
      reason: string;
      category: string;
      decisionNotes?: string;
      decidedBy: string;
    },
  ) {
    const response = await this.instance.post(`/${submissionId}/reject`, data);
    return response.data;
  }

  /**
   * Move to processing fee
   */
  static async moveToProcessingFee(
    submissionId: string,
    data: {
      feeAmount: number;
      changedBy: string;
    },
  ) {
    const response = await this.instance.put(
      `/${submissionId}/processing-fee`,
      data,
    );
    return response.data;
  }

  /**
   * Mark fee as paid
   */
  static async markFeeAsPaid(
    submissionId: string,
    data: {
      changedBy: string;
    },
  ) {
    const response = await this.instance.put(`/${submissionId}/fee-paid`, data);
    return response.data;
  }

  /**
   * Confirm disbursement
   */
  static async confirmDisbursement(
    submissionId: string,
    data: {
      amount: number;
      referenceNo: string;
      confirmedBy: string;
    },
  ) {
    const response = await this.instance.post(
      `/${submissionId}/disburse`,
      data,
    );
    return response.data;
  }

  /**
   * Allow resubmission to another bank
   */
  static async allowResubmission(
    submissionId: string,
    data: {
      authorizedBy: string;
    },
  ) {
    const response = await this.instance.put(
      `/${submissionId}/allow-resubmission`,
      data,
    );
    return response.data;
  }

  /**
   * Get submission details
   */
  static async getSubmissionDetails(submissionId: string) {
    const response = await this.instance.get(`/${submissionId}`);
    return response.data;
  }

  /**
   * Get bank incoming applications
   */
  static async getBankIncomingApplications(
    bankId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await this.instance.get(
      `/bank/${bankId}/incoming?${params.toString()}`,
    );
    return response.data;
  }

  /**
   * Get bank workflow analytics
   */
  static async getBankWorkflowAnalytics(bankId: string) {
    const response = await this.instance.get(`/bank/${bankId}/analytics`);
    return response.data;
  }
}
