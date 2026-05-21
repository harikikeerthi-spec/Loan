  // ==================== NEW METHODS ====================

  async getFileDetail(applicationId: string): Promise<any> {
    const { data, error } = await this.db
      .from('LoanApplication')
      .select('*, BankDecision(*), disbursements(*), file_quality_scores(*), queries(*)')
      .eq('id', applicationId)
      .single();
    if (error) throw error;
    return data;
  }

  async lookupByLan(lan: string): Promise<any> {
    const { data, error } = await this.db
      .from('LoanApplication')
      .select('*')
      .eq('lanNumber', lan)
      .single();
    if (error) throw error;
    return data;
  }

  async getMyFiles(bankName: string, filters: any): Promise<any[]> {
    let query = this.db
      .from('LoanApplication')
      .select('*')
      .not('lanNumber', 'is', null);

    query = this.matchBankFilter(query, bankName);

    if (filters.limit) query = query.limit(parseInt(filters.limit, 10));
    if (filters.offset) query = query.range(
      parseInt(filters.offset, 10),
      parseInt(filters.offset, 10) + (parseInt(filters.limit, 10) || 20) - 1
    );

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async amendDecision(applicationId: string, decisionId: string, details: any, user: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankDecision')
      .update(details)
      .eq('id', decisionId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, decision: data };
  }

  async uploadSanctionLetter(applicationId: string, fileUrl: string, user: any): Promise<any> {
    const { error } = await this.db
      .from('LoanApplication')
      .update({ sanctionLetterUrl: fileUrl, updatedAt: new Date().toISOString() })
      .eq('id', applicationId);
    if (error) throw error;
    return { success: true, sanctionLetterUrl: fileUrl };
  }

  async setRoi(applicationId: string, roiData: any, user: any): Promise<any> {
    const { error } = await this.db
      .from('LoanApplication')
      .update({
        roiType: roiData.roiType,
        roiBase: roiData.roiBase,
        roiEffective: roiData.roiEffective,
        roiSubsidy: roiData.roiSubsidy,
        updatedAt: new Date().toISOString()
      })
      .eq('id', applicationId);
    if (error) throw error;
    return { success: true };
  }

  async setProcessingFee(applicationId: string, feeData: any): Promise<any> {
    const { data, error } = await this.db
      .from('ProcessingFee')
      .insert({
        applicationId: applicationId,
        feeAmount: feeData.feeAmount,
        totalAmount: feeData.totalAmount,
        status: feeData.status || 'PENDING'
      })
      .select()
      .single();
    if (error) throw error;
    return { success: true, fee: data };
  }

  async updateProcessingFee(applicationId: string, updateData: any): Promise<any> {
    const { data, error } = await this.db
      .from('ProcessingFee')
      .update(updateData)
      .eq('applicationId', applicationId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, fee: data };
  }

  async getQueryThread(queryId: string): Promise<any> {
    const { data, error } = await this.db
      .from('BankQuery')
      .select('*, QueryResponse(*)')
      .eq('id', queryId)
      .single();
    if (error) throw error;
    return data;
  }

  async resolveQuery(queryId: string): Promise<any> {
    const { error } = await this.db
      .from('BankQuery')
      .update({ status: 'RESOLVED', resolvedAt: new Date().toISOString() })
      .eq('id', queryId);
    if (error) throw error;
    return { success: true };
  }

  async getAnalyticsMetrics(bankName: string): Promise<any> {
    return {
      success: true,
      bank: bankName,
      funnel: {
        total: 120,
        sanctioned: 85,
        rejected: 20,
        pending: 15
      },
      aging: {
        under_3_days: 10,
        over_3_days: 5
      }
    };
  }

  async getProducts(bankName: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('BankProduct')
      .select('*')
      .eq('bankId', bankName);
    if (error) throw error;
    return data || [];
  }

  async createProduct(productData: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankProduct')
      .insert(productData)
      .select()
      .single();
    if (error) throw error;
    return { success: true, product: data };
  }

  async updateProduct(productId: string, productData: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankProduct')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, product: data };
  }

  async getBranches(bankName: string): Promise<any[]> {
    const { data, error } = await this.db
      .from('BankBranch')
      .select('*')
      .eq('bankId', bankName);
    if (error) throw error;
    return data || [];
  }

  async createBranch(branchData: any): Promise<any> {
    const { data, error } = await this.db
      .from('BankBranch')
      .insert(branchData)
      .select()
      .single();
    if (error) throw error;
    return { success: true, branch: data };
  }

  async getOfficers(bankName: string): Promise<any[]> {
    return [
      { id: 'o1', name: 'John Doe' },
      { id: 'o2', name: 'Jane Smith' }
    ];
  }

  async exportApplicationsCsv(bankName: string): Promise<any> {
    return { success: true, csvData: 'id,status,amount\n1,SANCTIONED,1000' };
  }

  async exportMisReports(bankName: string): Promise<any> {
    return { success: true, reportUrl: 'http://example.com/report.csv' };
  }
}
