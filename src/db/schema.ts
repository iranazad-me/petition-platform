import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const petitions = pgTable("petitions", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	text: text("text").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const signatures = pgTable(
	"signatures",
	{
		id: text("id").primaryKey(),
		petitionId: text("petition_id")
			.notNull()
			.references(() => petitions.id),
		universityName: text("university_name").notNull(),
		facultyName: text("faculty_name").notNull(),
		displayNameMasked: text("display_name_masked"),
		displayIdentifierLastDigitsMasked: text(
			"display_identifier_last_digits_masked",
		),
		displayConsentName: boolean("display_consent_name")
			.notNull()
			.default(false),
		displayConsentIdentifier: boolean("display_consent_identifier")
			.notNull()
			.default(false),
		hStudentId: text("h_student_id"),
		hNationalId: text("h_national_id"),
		hStudentNationalCombo: text("h_student_national_combo"),
		hSubmissionFingerprint: text("h_submission_fingerprint"),
		hDeviceFingerprint: text("h_device_fingerprint"),
		hSessionBinding: text("h_session_binding"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("signatures_unique_combo_per_petition").on(
			table.petitionId,
			table.hStudentNationalCombo,
		),
		index("signatures_idx_petition_student").on(
			table.petitionId,
			table.hStudentId,
		),
		index("signatures_idx_petition_national").on(
			table.petitionId,
			table.hNationalId,
		),
		index("signatures_idx_petition_created").on(
			table.petitionId,
			table.createdAt,
		),
		index("signatures_idx_petition_submission_fp").on(
			table.petitionId,
			table.hSubmissionFingerprint,
		),
		index("signatures_idx_device_session").on(
			table.petitionId,
			table.hDeviceFingerprint,
			table.hSessionBinding,
		),
	],
);

export const fraudSignals = pgTable(
	"fraud_signals",
	{
		id: text("id").primaryKey(),
		signatureId: text("signature_id").references(() => signatures.id, {
			onDelete: "cascade",
		}),
		petitionId: text("petition_id")
			.notNull()
			.references(() => petitions.id),
		hIpWindowed: text("h_ip_windowed").notNull(),
		hDeviceFingerprint: text("h_device_fingerprint").notNull(),
		hUserAgent: text("h_user_agent").notNull(),
		hSessionBinding: text("h_session_binding").notNull(),
		riskScore: integer("risk_score").notNull(),
		riskLevel: text("risk_level").notNull(),
		decision: text("decision").notNull(),
		reasonsJson: text("reasons_json").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("fraud_signals_idx_petition_created").on(
			table.petitionId,
			table.createdAt,
		),
		index("fraud_signals_idx_petition_device").on(
			table.petitionId,
			table.hDeviceFingerprint,
		),
		index("fraud_signals_idx_petition_ip").on(
			table.petitionId,
			table.hIpWindowed,
		),
	],
);

export const submissionNonces = pgTable(
	"submission_nonces",
	{
		nonce: text("nonce").primaryKey(),
		sessionId: text("session_id").notNull(),
		csrfToken: text("csrf_token").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		usedAt: timestamp("used_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("submission_nonces_idx_session").on(table.sessionId),
		index("submission_nonces_idx_expires").on(table.expiresAt),
	],
);
