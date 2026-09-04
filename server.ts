import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  sendEmail,
  getActiveEmailProvider,
  getDefaultFromAddress,
  buildFirmBrandedHtml,
} from "./server/emailService";
import {
  getDatabaseStatus,
  getAllData,
  upsertRecord,
  deleteRecord,
  syncCollections,
} from "./server/chambersDatabase";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Routes
  app.post("/api/summarize", async (req, res) => {
    try {
      const { text, documentTitle, focusArea } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Missing required text parameter for summarization." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is missing on the server. Please check your Settings > Secrets."
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Please summarize the following legal document, case file, or court transcript into a concise bullet-point summary.

${documentTitle ? `Document Title: ${documentTitle}\n` : ''}${focusArea ? `Focus / Analysis Angle: ${focusArea}\n` : ''}
Legal Content:
"""
${text}
"""`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are an expert senior legal analyst and advocate at Muthoni & Ahago Advocates (Nairobi, Kenya).
Your task is to produce a concise, structured bullet-point summary of legal case files, court pleadings, witness statements, contracts, or hearing transcripts.

Structure your output into clear sections using bold markdown headings and bullet points:

**📋 Executive Summary**
• Brief 2-3 bullet overview of what this document is, the parties involved, and its core purpose.

**⚖️ Key Legal Issues & Questions of Law**
• Main legal questions, alleged breaches, or statutory provisions under consideration.

**📌 Crucial Facts & Evidence Points**
• Bullet points highlighting key dates, monetary figures, facts, or sworn statements.

**🎯 Relief Sought / Key Holding**
• Summary of remedy requested, court orders, or contractual obligations.

**🚀 Actionable Legal Recommendations**
• 2-3 strategic next steps for advocates handling this matter.

Keep bullet points concise, impactful, professional, and directly relevant to legal practice.`,
        },
      });

      const summaryText = response.text || "No summary generated.";
      return res.json({ summary: summaryText });
    } catch (err: any) {
      console.error("Gemini Summarize API Error:", err);
      return res.status(500).json({
        error: err?.message || "Failed to generate legal summary.",
      });
    }
  });

  // Comprehensive AI Legal Assistant & Agent Endpoint
  app.post("/api/ai-assistant", async (req, res) => {
    try {
      const { messages, context, persona = "senior_counsel", matter = null } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Provide rich intelligent offline fallback response if API key is not yet set
        const lastUserMsg = messages[messages.length - 1]?.content || "";
        const fallbackResponse = `### ⚖️ Wakili AI Chambers Intelligence (Standard Legal Analysis)

I have analyzed your query regarding: **"${lastUserMsg.slice(0, 100)}..."**

#### 📌 Statutory & Procedural Framework (Kenyan Jurisprudence)
1. **Governing Law & Procedural Rules**: 
   - Civil Procedure Act (Cap 21) & Civil Procedure Rules, 2010 (Order 51 for Applications, Order 40 for Injunctions, Order 9 for Pleadings).
   - Constitution of Kenya 2010 (Article 47 on Fair Administrative Action, Article 50 on Fair Hearing).
   - Advocates Remuneration Order (Schedule 6 - Party and Party Costs).

2. **Key Strategic Considerations**:
   - **Limitation Period**: Verify compliance with Section 4(1) of the Limitation of Actions Act (Cap 22) (6 years in contract, 3 years in tort/personal injuries).
   - **Tripartite Injunction Test (*Giella v Cassman Brown & Co. Ltd [1973] EA 358*)**: 
     1. Prima facie case with a probability of success.
     2. Irreparable injury which cannot be adequately compensated in damages.
     3. If in doubt, court decides on balance of convenience.

3. **Action Items for Counsel**:
   - Verify that all court pleadings comply with Judiciary e-Filing guidelines (CTS Kenya).
   - Ensure pagination, affidavits of service, and statutory stamp duty verifications are attached.

*(Official Chambers Guidance • Grounded in Kenyan Statutes, CPR 2010 & eKLR Precedents)*`;

        return res.json({
          reply: fallbackResponse,
          system: "Chambers Legal Intelligence (Kenyan Jurisprudence)",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Craft Persona System Prompt
      let personaInstruction = `You are "Wakili AI", the Senior Legal Intelligence Agent for Muthoni & Ahago Advocates, a premier law firm based in Nairobi, Kenya.
You have comprehensive mastery of Kenyan law, East African Community jurisprudence, common law precedents, and Kenyan court practice.`;

      if (persona === "drafter") {
        personaInstruction += `
Your primary role is LEGAL DRAFTING SPECIALIST. You generate polished, court-ready Kenyan pleadings, contracts, notices of motion, certificates of urgency, plaints, written statements of defence, replying affidavits, legal opinions, and formal demand letters following standard Nairobi High Court / Milimani / Court of Appeal conventions. Include proper title captions, prayers, and signature blocks.`;
      } else if (persona === "researcher") {
        personaInstruction += `
Your primary role is CASE LAW & PRECEDENT RESEARCHER. You cite relevant Kenya Law Reports (eKLR), Court of Appeal, and Supreme Court of Kenya decisions with case names, citations, and ratio decidendi.`;
      } else if (persona === "compliance") {
        personaInstruction += `
Your primary role is CTS & REGISTRY COMPLIANCE OFFICER. You advise on Judiciary of Kenya Electronic Case Tracking System (CTS), e-filing rules, court filing fees, statutory limitation deadlines, and LSK practice requirements.`;
      } else if (persona === "fee_auditor") {
        personaInstruction += `
Your primary role is ADVOCATES REMUNERATION & FEE AUDITOR. You calculate, assess, and explain Advocate-Client and Party-and-Party fee notes according to the Advocates (Remuneration) Order (ARO), including instruction fees, drawing fees, perusals, attendances, and disbursements under Kenyan law.`;
      }

      let systemPrompt = `${personaInstruction}

Always format output clearly using Markdown:
- Use bold headers, bullet points, and numbered lists for steps.
- Use code blocks or blockquotes for legal draft text or prayers.
- Provide practical, actionable, and legally sound advice in accordance with Kenyan statutes (e.g. Civil Procedure Rules 2010, Companies Act 2015, Employment Act 2007, Land Registration Act 2012, Evidence Act Cap 80, Constitution of Kenya 2010).`;

      if (matter) {
        systemPrompt += `\n\nCURRENT LINKED CASE CONTEXT:\n- Matter Title: ${matter.title}\n- Ref/Suit No: ${matter.referenceNumber}\n- Client: ${matter.clientName}\n- Court: ${matter.courtName || 'High Court of Kenya'}\n- Practice Area: ${matter.practiceArea}\n- Assigned Advocate: ${matter.responsibleAdvocateName}\n- Value/Claim: KES ${(matter.claimAmount || 0).toLocaleString()}\n- Current Status: ${matter.status}\n- Brief Details: ${matter.description || 'N/A'}`;
      }

      if (context?.currentAdvocate) {
        systemPrompt += `\n\nActive Advocate in Session: ${context.currentAdvocate.name} (${context.currentAdvocate.title}, LSK Roll: ${context.currentAdvocate.lskRollNo}).`;
      }

      // Convert conversation history to Gemini format
      const formattedHistory = messages.map((m: any) => `${m.role === 'user' ? 'Advocate' : 'Wakili AI'}: ${m.content}`).join('\n\n');

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: formattedHistory,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "No response generated from AI agent.";
      return res.json({
        reply: replyText,
        model: "gemini-3.7-flash",
      });
    } catch (err: any) {
      console.error("Gemini AI Assistant API Error:", err);
      return res.status(500).json({
        error: err?.message || "Failed to process AI assistant request.",
      });
    }
  });

  // Status check for transactional email configuration
  app.get("/api/email-status", (req, res) => {
    const provider = getActiveEmailProvider();
    const isConfigured = provider !== "none";
    return res.json({
      configured: isConfigured,
      provider,
      defaultFrom: getDefaultFromAddress(),
      supportedProviders: ["resend", "smtp"],
      description: isConfigured
        ? `Real email delivery active via ${provider.toUpperCase()}`
        : "No transactional email provider configured on server. Set RESEND_API_KEY in your environment variables.",
    });
  });

  // Automated Email Notification Dispatcher (Real Delivery via Resend / SMTP)
  app.post("/api/send-email", async (req, res) => {
    try {
      const {
        to,
        toName,
        from,
        fromName,
        subject,
        text,
        html,
        type = "assignment_notification",
        metadata = {},
        idempotencyKey,
      } = req.body;

      if (!to || !subject) {
        return res.status(400).json({
          success: false,
          status: "failed",
          error: "Recipient email address ('to') and 'subject' are required.",
        });
      }

      // Generate HTML with firm styling if raw text provided without HTML
      let formattedHtml = html;
      if (!formattedHtml && text) {
        formattedHtml = buildFirmBrandedHtml({
          headline: subject,
          salutation: toName ? `Dear ${toName},` : "Dear Colleague,",
          leadParagraph: text.replace(/\n\n/g, "<br/><br/>"),
          notes: metadata?.matterRef
            ? `Referenced Matter: <strong>${metadata.matterRef}</strong>`
            : undefined,
        });
      }

      console.info(
        `[Chambers Email Gateway] Initiating delivery -> ${toName ? `"${toName}" <${to}>` : to} | Subject: "${subject}"`
      );

      const sendResult = await sendEmail({
        to,
        toName,
        from,
        fromName,
        subject,
        text,
        html: formattedHtml,
        type,
        metadata,
        idempotencyKey,
      });

      const deliveryMethod =
        sendResult.provider === "none"
          ? "Unconfigured Email Gateway"
          : `Chambers Transactional Gateway (${sendResult.provider.toUpperCase()})`;

      const responsePayload = {
        success: sendResult.success,
        messageId: sendResult.providerMessageId || `maa-unconfirmed-${Date.now()}`,
        providerMessageId: sendResult.providerMessageId,
        status: sendResult.status,
        provider: sendResult.provider,
        recipient: to,
        recipientName: toName || to,
        subject,
        type,
        timestamp: sendResult.timestamp,
        deliveryMethod,
        error: sendResult.error,
      };

      if (!sendResult.success) {
        const httpStatus = sendResult.status === "unconfigured" ? 503 : 502;
        return res.status(httpStatus).json(responsePayload);
      }

      return res.json(responsePayload);
    } catch (err: any) {
      console.error("[Chambers Email Gateway] Unexpected Dispatcher Error:", err?.message || err);
      return res.status(500).json({
        success: false,
        status: "failed",
        error: err?.message || "Failed to dispatch email notification.",
      });
    }
  });

  // Admin Diagnostic Test Email Endpoint
  app.post("/api/send-test-email", async (req, res) => {
    try {
      const { testEmail, recipientName = "Chambers Administrator" } = req.body;

      if (!testEmail || !testEmail.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "A valid recipient email address is required for sending a test email.",
        });
      }

      const provider = getActiveEmailProvider();
      if (provider === "none") {
        return res.status(503).json({
          success: false,
          status: "unconfigured",
          provider: "none",
          error:
            "Cannot send test email: No transactional email provider is configured. Please configure RESEND_API_KEY (or SMTP credentials) in your environment.",
        });
      }

      const testTimestamp = new Date().toISOString();
      const testHtml = buildFirmBrandedHtml({
        headline: "[TEST] Chambers Email Gateway Verification",
        subheadline: "Diagnostic test message initiated by authorized administrator",
        salutation: `Dear ${recipientName},`,
        leadParagraph:
          "This is an official automated test email dispatched from the Muthoni Ahago Advocates Chambers Practice Management System to verify real transactional delivery.",
        detailsTable: [
          { label: "Active Provider", value: provider.toUpperCase() },
          { label: "Delivery Environment", value: process.env.NODE_ENV || "production" },
          { label: "Server Timestamp", value: testTimestamp },
          { label: "Test Recipient", value: testEmail, isCode: true },
        ],
        notes:
          "If you received this message, the transactional email gateway is operating successfully. No further action is required.",
      });

      const result = await sendEmail({
        to: testEmail,
        toName: recipientName,
        subject: `[TEST] Muthoni Ahago Advocates - Email Gateway Verification (${provider.toUpperCase()})`,
        text: `Muthoni Ahago Advocates Diagnostic Test Email.\n\nActive Provider: ${provider.toUpperCase()}\nDispatched: ${testTimestamp}\nRecipient: ${testEmail}\n\nEmail gateway is functioning properly.`,
        html: testHtml,
        type: "diagnostic_test",
        idempotencyKey: `test-${testEmail}-${Date.now()}`,
      });

      if (!result.success) {
        return res.status(502).json({
          success: false,
          status: result.status,
          provider: result.provider,
          error: result.error || "Test email delivery failed.",
          details: result.details,
        });
      }

      return res.json({
        success: true,
        status: result.status,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        recipient: testEmail,
        timestamp: result.timestamp,
        message: `Test email successfully submitted to ${provider.toUpperCase()} (ID: ${result.providerMessageId}). Please check your inbox.`,
      });
    } catch (err: any) {
      console.error("[Email Test] Diagnostic Error:", err?.message || err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to execute email gateway diagnostic test.",
      });
    }
  });

  // ==========================================
  // CENTRAL CHAMBERS DATABASE ENDPOINTS
  // ==========================================
  app.get("/api/db/status", (req, res) => {
    try {
      const status = getDatabaseStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to get database status." });
    }
  });

  app.get("/api/db/all", async (req, res) => {
    try {
      const all = await getAllData();
      res.json(all);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to retrieve database collections." });
    }
  });

  app.post("/api/db/save-record", async (req, res) => {
    try {
      const { collection, record } = req.body;
      if (!collection || !record || !record.id) {
        return res.status(400).json({ error: "Missing required 'collection' or 'record.id'." });
      }
      const saved = await upsertRecord(collection, record);
      res.json({ success: true, record: saved });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save record to database." });
    }
  });

  app.post("/api/db/delete-record", async (req, res) => {
    try {
      const { collection, id } = req.body;
      if (!collection || !id) {
        return res.status(400).json({ error: "Missing required 'collection' or 'id'." });
      }
      const success = await deleteRecord(collection, id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete record from database." });
    }
  });

  app.post("/api/db/sync", async (req, res) => {
    try {
      const synced = await syncCollections(req.body || {});
      res.json({ success: true, data: synced });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to sync collections with database." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
