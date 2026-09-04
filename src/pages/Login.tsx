import React, { useState } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { ApiError, authApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: () => void;
}

const APP_NAME = 'Security Log Analysis Platform';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(formData.email, formData.password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      onLogin();
    } catch (err) {
      // The API layer speaks fetch and throws ApiError. Reading
      // `err.response.data.message` here is the axios shape, so the real
      // message was always discarded in favour of the fallback.
      setError(
        err instanceof ApiError ? err.message : 'Authentication failed',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-cyan-950 flex items-center justify-center p-4">
      {/* Background glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {/* University logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-lg shadow-cyan-500/20 border border-cyan-500/20 overflow-hidden">
            <img
              src="/logo.jpeg"
              alt="Oguz Han Engineering and Technology University of Turkmenistan"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{APP_NAME}</h1>
          <p className="text-gray-400 text-sm">{t.login.subtitle}</p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-medium text-white mb-6 text-center">
            {t.login.loginTab}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t.common.email}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder={t.login.emailPlaceholder}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">{t.common.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  placeholder={t.login.passwordPlaceholder}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t.login.processing}</span>
                </>
              ) : (
                <span>{t.login.signIn}</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-500 text-center">
            {t.login.accountsByAdmin}
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t.login.protectedBy}
        </p>
      </div>
    </div>
  );
};

export default Login;