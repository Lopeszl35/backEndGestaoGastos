import express from "express";
import cors from "cors";
import verifyToken from "../../middleware/verifyToken.js";
import { authLimiter } from "../../middleware/authLimiter.js";
import {
  validateCreateUser,
  validateLoginUser,
  validateGetUserSaldo,
  validateUserSaldo,
  validateUpdateUser,
  validateDeleteUser,
} from "./validateUsers.js";

const router = express.Router();
router.use(cors());

export default (userController) => {
  router.post("/createUser", validateCreateUser, (req, res, next) => {
    userController.createUser(req, res, next);
  });

  router.post("/loginUser", authLimiter, validateLoginUser, (req, res, next) => {
    userController.loginUser(req, res, next);
  });

  router.post("/auth/refreshToken", (req, res, next) => {
    userController.refreshToken(req, res, next);
  });

  router.post("/auth/logout", (req, res, next) => {
    userController.logout(req, res, next);
  });

  router.get("/userSaldo", verifyToken, validateGetUserSaldo, (req, res, next) => {
    userController.getUserSaldo(req, res, next);
  });

  router.put("/userSaldo", verifyToken, validateUserSaldo, (req, res, next) => {
    userController.atualizarUserSaldo(req, res, next);
  });

  router.put("/atualizarUsuario/:userId", verifyToken, validateUpdateUser, (req, res, next) => {
    userController.atualizarUsuario(req, res, next);
  }
  );

  router.get("/userData/:userId", verifyToken, (req, res, next) => {
    userController.getUserData(req, res, next);
  });

  router.delete("/deleteUser/:userId", verifyToken, validateDeleteUser, (req, res, next) => {
    userController.deleteUser(req, res, next);
  });

  return router;
};
