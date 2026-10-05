import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { usersRoutes } from "../modules/users/users.routes.js";
import { professionalsRoutes } from "../modules/professionals/professionals.routes.js";
import { verificationRoutes } from "../modules/verification/verification.routes.js";
import { publicationsRoutes } from "../modules/publications/publications.routes.js";
import { subscriptionsRoutes } from "../modules/subscriptions/subscriptions.routes.js";
import { paymentsRoutes } from "../modules/payments/payments.routes.js";
import { conversationsRoutes } from "../modules/conversations/conversations.routes.js";
import { messagesRoutes } from "../modules/messages/messages.routes.js";
import { documentsRoutes } from "../modules/documents/documents.routes.js";
import { reportsRoutes } from "../modules/reports/reports.routes.js";
import { adminRoutes } from "../modules/admin/admin.routes.js";

export const apiRouter = Router();

// Health check endpoint
apiRouter.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "sylla-voyage-api",
  });
});

// Domain routes mounting
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/professionals", professionalsRoutes);
apiRouter.use("/verification", verificationRoutes);
apiRouter.use("/publications", publicationsRoutes);
apiRouter.use("/subscriptions", subscriptionsRoutes);
apiRouter.use("/payments", paymentsRoutes);
apiRouter.use("/conversations", conversationsRoutes);
apiRouter.use("/messages", messagesRoutes);
apiRouter.use("/documents", documentsRoutes);
apiRouter.use("/reports", reportsRoutes);
apiRouter.use("/admin", adminRoutes);
