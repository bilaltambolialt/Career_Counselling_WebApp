import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth.js';

/**
 * Shared login form logic — used by all 4 role-specific login pages.
 * @param {string} role - 'student' | 'admin' | 'counselor' | 'super_admin'
 * @param {string} redirectPath - where to navigate after successful login
 */
export const useLoginForm = (role, redirectPath) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password, role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = () => setShowPassword((v) => !v);

  return {
    email, setEmail,
    password, setPassword,
    showPassword, togglePassword,
    error,
    isLoading,
    handleSubmit,
  };
};
