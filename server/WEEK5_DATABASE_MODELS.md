# Week 5 Database Models & Schemas

## Database Tables Required

### 1. Chat Messages & Rooms (F21)

#### chat_rooms
```sql
CREATE TABLE chat_rooms (
  id BIGINT PRIMARY KEY DEFAULT nextval('chat_rooms_id_seq'),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('direct', 'group')),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdBy UUID REFERENCES auth.users(id)
);

CREATE TABLE chat_room_members (
  id BIGINT PRIMARY KEY DEFAULT nextval('chat_room_members_id_seq'),
  roomId BIGINT REFERENCES chat_rooms(id) ON DELETE CASCADE,
  userId UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joinedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mutedUntil TIMESTAMP WITH TIME ZONE,
  UNIQUE(roomId, userId)
);

CREATE TABLE chat_messages (
  id BIGINT PRIMARY KEY DEFAULT nextval('chat_messages_id_seq'),
  roomId BIGINT REFERENCES chat_rooms(id) ON DELETE CASCADE,
  senderId UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  messageType VARCHAR(50) DEFAULT 'text' CHECK (messageType IN ('text', 'file', 'image', 'system')),
  fileUrl VARCHAR(500),
  fileName VARCHAR(255),
  fileSize BIGINT,
  fileMimeType VARCHAR(100),
  isEdited BOOLEAN DEFAULT false,
  editedAt TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'read')),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_message_reads (
  id BIGINT PRIMARY KEY DEFAULT nextval('chat_message_reads_id_seq'),
  messageId BIGINT REFERENCES chat_messages(id) ON DELETE CASCADE,
  userId UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  readAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(messageId, userId)
);

CREATE TABLE user_online_status (
  userId UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  isOnline BOOLEAN DEFAULT false,
  lastSeen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  currentRoom BIGINT REFERENCES chat_rooms(id)
);
```

### 2. Slack Integration (F26)

#### slack_integrations
```sql
CREATE TABLE slack_integrations (
  id BIGINT PRIMARY KEY DEFAULT nextval('slack_integrations_id_seq'),
  teamId VARCHAR(255) NOT NULL UNIQUE,
  teamName VARCHAR(255),
  botToken VARCHAR(500) NOT NULL,
  userToken VARCHAR(500),
  webhookUrl VARCHAR(500),
  webhookSecret VARCHAR(500),
  channelMappings JSONB, -- {"decisions": "#channel-name", "queries": "#channel-name"}
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdBy UUID REFERENCES auth.users(id),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE slack_auto_post_rules (
  id BIGINT PRIMARY KEY DEFAULT nextval('slack_auto_post_rules_id_seq'),
  integrationId BIGINT REFERENCES slack_integrations(id) ON DELETE CASCADE,
  eventType VARCHAR(100) NOT NULL, -- 'decision', 'query', 'milestone'
  channelId VARCHAR(255),
  condition JSONB, -- {"status": "approved", "amount": {"min": 50000}}
  template VARCHAR(1000),
  isEnabled BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE slack_message_history (
  id BIGINT PRIMARY KEY DEFAULT nextval('slack_message_history_id_seq'),
  integrationId BIGINT REFERENCES slack_integrations(id),
  channelId VARCHAR(255),
  messageTs VARCHAR(255),
  sourceType VARCHAR(100), -- 'decision', 'query', 'event'
  sourceId VARCHAR(255),
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'failed', 'updated'
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Salesforce Sync (F27)

#### salesforce_sync_config
```sql
CREATE TABLE salesforce_sync_config (
  id BIGINT PRIMARY KEY DEFAULT nextval('salesforce_sync_config_id_seq'),
  instanceUrl VARCHAR(500) NOT NULL,
  clientId VARCHAR(255) NOT NULL,
  clientSecret VARCHAR(500) NOT NULL,
  username VARCHAR(255),
  password VARCHAR(500),
  securityToken VARCHAR(500),
  accessToken VARCHAR(500),
  refreshToken VARCHAR(500),
  tokenExpiresAt TIMESTAMP WITH TIME ZONE,
  isActive BOOLEAN DEFAULT true,
  lastSyncAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sf_user_mapping (
  id BIGINT PRIMARY KEY DEFAULT nextval('sf_user_mapping_id_seq'),
  loantechUserId UUID REFERENCES auth.users(id),
  sfContactId VARCHAR(255),
  sfLeadId VARCHAR(255),
  syncedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sf_application_sync (
  id BIGINT PRIMARY KEY DEFAULT nextval('sf_application_sync_id_seq'),
  applicationId VARCHAR(255) NOT NULL,
  sfOpportunityId VARCHAR(255),
  loanAmount DECIMAL(15, 2),
  productType VARCHAR(100),
  syncStatus VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  lastError TEXT,
  syncedAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sf_sync_audit (
  id BIGINT PRIMARY KEY DEFAULT nextval('sf_sync_audit_id_seq'),
  objectType VARCHAR(100), -- 'Contact', 'Lead', 'Opportunity'
  objectId VARCHAR(255),
  action VARCHAR(50), -- 'create', 'update'
  payload JSONB,
  response JSONB,
  status VARCHAR(50), -- 'success', 'failed'
  errorMessage TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Auto-Assignment Rules (F41)

#### assignment_rules
```sql
CREATE TABLE assignment_rules (
  id BIGINT PRIMARY KEY DEFAULT nextval('assignment_rules_id_seq'),
  name VARCHAR(255) NOT NULL,
  priority INT DEFAULT 100,
  ruleType VARCHAR(100) NOT NULL, -- 'region', 'amount', 'course', 'roundrobin'
  conditions JSONB NOT NULL, -- {"region": ["UP", "MP"], "minAmount": 100000}
  assignTo VARCHAR(100), -- 'officer', 'senior_officer', 'specialist', 'next_available'
  assignToValue VARCHAR(255), -- officer ID or role
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assignment_logs (
  id BIGINT PRIMARY KEY DEFAULT nextval('assignment_logs_id_seq'),
  applicationId VARCHAR(255) NOT NULL,
  ruleId BIGINT REFERENCES assignment_rules(id),
  assignedTo UUID REFERENCES auth.users(id),
  reason TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Bank Schemes (F37)

#### bank_schemes
```sql
CREATE TABLE bank_schemes (
  id BIGINT PRIMARY KEY DEFAULT nextval('bank_schemes_id_seq'),
  name VARCHAR(255) NOT NULL,
  bank VARCHAR(255) NOT NULL,
  description TEXT,
  minAmount DECIMAL(15, 2),
  maxAmount DECIMAL(15, 2),
  interestRateMin DECIMAL(5, 2),
  interestRateMax DECIMAL(5, 2),
  repaymentYearsMin INT,
  repaymentYearsMax INT,
  eligibility JSONB, -- {"minAge": 21, "maxAge": 65, "courseTypes": [...]}
  documentsRequired JSON,
  processingFee DECIMAL(8, 2),
  isActive BOOLEAN DEFAULT true,
  validityStart DATE,
  validityEnd DATE,
  visibleTo VARCHAR(50) DEFAULT 'all', -- 'all', 'staff', 'partners'
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdBy UUID REFERENCES auth.users(id)
);

CREATE TABLE scheme_expiry_audit (
  id BIGINT PRIMARY KEY DEFAULT nextval('scheme_expiry_audit_id_seq'),
  schemeId BIGINT REFERENCES bank_schemes(id),
  action VARCHAR(50), -- 'expired', 'extended'
  oldEnd DATE,
  newEnd DATE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Bulk Export (F28)

#### export_jobs
```sql
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES auth.users(id),
  jobType VARCHAR(50) NOT NULL, -- 'applications', 'users', 'schemes', 'reports'
  filters JSONB, -- search/filter criteria
  format VARCHAR(20) DEFAULT 'csv', -- 'csv', 'excel', 'pdf'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  fileUrl VARCHAR(500),
  fileSize BIGINT,
  totalRecords INT,
  processedRecords INT,
  errorMessage TEXT,
  requestedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completedAt TIMESTAMP WITH TIME ZONE,
  expiresAt TIMESTAMP WITH TIME ZONE
);

CREATE TABLE export_columns_config (
  id BIGINT PRIMARY KEY DEFAULT nextval('export_columns_config_id_seq'),
  userId UUID REFERENCES auth.users(id),
  jobType VARCHAR(50) NOT NULL,
  selectedColumns TEXT[] NOT NULL,
  isDefault BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. Officer Targets (F40)

#### officer_targets
```sql
CREATE TABLE officer_targets (
  id BIGINT PRIMARY KEY DEFAULT nextval('officer_targets_id_seq'),
  officerId UUID REFERENCES auth.users(id),
  targetMonth DATE NOT NULL,
  targetApplications INT,
  targetAmount DECIMAL(15, 2),
  targetConversions INT DEFAULT 0,
  notes TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE officer_achievements (
  id BIGINT PRIMARY KEY DEFAULT nextval('officer_achievements_id_seq'),
  officerId UUID REFERENCES auth.users(id),
  targetMonth DATE NOT NULL,
  applicationsProcessed INT DEFAULT 0,
  amountProcessed DECIMAL(15, 2) DEFAULT 0,
  conversions INT DEFAULT 0,
  lastUpdated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rm_profiles (
  id BIGINT PRIMARY KEY DEFAULT nextval('rm_profiles_id_seq'),
  userId UUID REFERENCES auth.users(id) UNIQUE,
  region VARCHAR(100),
  businessVertical VARCHAR(100),
  portfolio JSONB,
  commissionStructure JSONB,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. Scheduled Reports (F38, F46)

#### scheduled_reports
```sql
CREATE TABLE scheduled_reports (
  id BIGINT PRIMARY KEY DEFAULT nextval('scheduled_reports_id_seq'),
  name VARCHAR(255) NOT NULL,
  reportType VARCHAR(100) NOT NULL, -- 'daily_summary', 'weekly_pipeline', 'monthly_mis'
  frequency VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
  scheduleTime TIME,
  scheduleDay VARCHAR(20), -- for weekly/monthly
  recipients TEXT[] NOT NULL,
  isActive BOOLEAN DEFAULT true,
  lastRunAt TIMESTAMP WITH TIME ZONE,
  nextRunAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE report_runs (
  id BIGINT PRIMARY KEY DEFAULT nextval('report_runs_id_seq'),
  reportId BIGINT REFERENCES scheduled_reports(id),
  status VARCHAR(50), -- 'success', 'failed'
  fileUrl VARCHAR(500),
  recordsIncluded INT,
  executedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE student_ratings (
  id BIGINT PRIMARY KEY DEFAULT nextval('student_ratings_id_seq'),
  studentId UUID REFERENCES auth.users(id),
  ratedBy UUID REFERENCES auth.users(id),
  applicationId VARCHAR(255),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  category VARCHAR(100), -- 'cooperation', 'documentation', 'communication'
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rating_aggregates (
  id BIGINT PRIMARY KEY DEFAULT nextval('rating_aggregates_id_seq'),
  studentId UUID REFERENCES auth.users(id),
  avgRating DECIMAL(3, 2),
  totalRatings INT,
  lastUpdated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9-11. Configuration APIs (F17, F18, F19)

#### product_configs
```sql
CREATE TABLE product_configs (
  id BIGINT PRIMARY KEY DEFAULT nextval('product_configs_id_seq'),
  bankId VARCHAR(255) NOT NULL,
  productType VARCHAR(100) NOT NULL,
  productName VARCHAR(255),
  description TEXT,
  features JSONB,
  parameters JSONB, -- default values for this product
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdBy UUID REFERENCES auth.users(id)
);

CREATE TABLE checklist_configs (
  id BIGINT PRIMARY KEY DEFAULT nextval('checklist_configs_id_seq'),
  bankId VARCHAR(255) NOT NULL,
  productType VARCHAR(100),
  checklistName VARCHAR(255),
  items JSONB, -- [{"name": "Aadhar", "required": true, "conditional": false}]
  displayOrder INT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE branch_configs (
  id BIGINT PRIMARY KEY DEFAULT nextval('branch_configs_id_seq'),
  branchCode VARCHAR(100) NOT NULL UNIQUE,
  branchName VARCHAR(255) NOT NULL,
  bankId VARCHAR(255),
  location VARCHAR(255),
  region VARCHAR(100),
  staffCount INT,
  maxDailyApplications INT,
  processingCapacity INT,
  configuration JSONB, -- branch-specific settings
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdBy UUID REFERENCES auth.users(id)
);
```

## Indexes

```sql
CREATE INDEX idx_chat_messages_roomId ON chat_messages(roomId);
CREATE INDEX idx_chat_messages_senderId ON chat_messages(senderId);
CREATE INDEX idx_chat_messages_createdAt ON chat_messages(createdAt);

CREATE INDEX idx_assignment_logs_applicationId ON assignment_logs(applicationId);
CREATE INDEX idx_assignment_logs_createdAt ON assignment_logs(createdAt);

CREATE INDEX idx_bank_schemes_validityEnd ON bank_schemes(validityEnd) WHERE isActive = true;
CREATE INDEX idx_bank_schemes_bank ON bank_schemes(bank);

CREATE INDEX idx_export_jobs_userId ON export_jobs(userId);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);

CREATE INDEX idx_officer_targets_officerId ON officer_targets(officerId);
CREATE INDEX idx_officer_targets_targetMonth ON officer_targets(targetMonth);

CREATE INDEX idx_scheduled_reports_nextRunAt ON scheduled_reports(nextRunAt);

CREATE INDEX idx_product_configs_bankId ON product_configs(bankId);
CREATE INDEX idx_branch_configs_branchCode ON branch_configs(branchCode);
```

## Row Level Security (RLS) Policies

- Chat messages: Users can only see rooms they're members of
- Officer targets: Officers see their own targets, managers see their team's targets
- Reports: Staff can only access reports they have permission for
- Configurations: Bank staff can view/edit branch configs
