import { Router } from 'express';
import {
  getUsers, getUser, addUser, updateUser, deleteUser,
  assignRole, blockUser, unblockUser, reactivateUser,
  getPendingUsers, approveUser, rejectUser,
  getRoleRequests, approveRoleRequest, rejectRoleRequest
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('admin'));

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.post('/users', addUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.patch('/users/:id/role', assignRole);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);
router.post('/reactivate', reactivateUser);

router.get('/pending-users', getPendingUsers);
router.post('/approve-user', approveUser);
router.post('/reject-user', rejectUser);

router.get('/role-requests', getRoleRequests);
router.post('/role-requests/:requestId/approve', approveRoleRequest);
router.post('/role-requests/:requestId/reject', rejectRoleRequest);

export default router;