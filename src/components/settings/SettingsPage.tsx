// SettingsPage - Basic settings for MVP (Gemini API key only)
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useAI } from '../../hooks/useAI';

export function SettingsPage() {
  const { settings, saveSettings, isLoading } = useSettings();
  const { testConnection } = useAI(settings);

  const [apiKey, setApiKeyInput] = useState(settings.gemini.apiKey);
  const [model, setModel] = useState(settings.gemini.model);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection();
      setTestResult(result ? 'success' : 'error');
    } catch (err) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await saveSettings({
        ...settings,
        gemini: {
          apiKey,
          model,
        },
      });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Settings
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* AI Provider Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                AI Provider
              </h2>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>MVP:</strong> Currently only Google Gemini is supported.
                  Get your free API key at{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-900"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            </div>

            {/* API Key Input */}
            <div>
              <label
                htmlFor="api-key"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Gemini API Key
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-500">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>

            {/* Model Selector */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Faster, Free)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Better Quality)</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Flash Lite is faster and free. Flash provides better quality responses.
              </p>
            </div>

            {/* Test Connection Button */}
            <div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!apiKey.trim() || isTesting}
                className="w-full px-6 py-3 text-lg font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>

              {testResult === 'success' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Connection successful!
                  </p>
                </div>
              )}

              {testResult === 'error' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Connection failed. Check your API key.
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div>
              <button
                type="submit"
                disabled={!apiKey.trim() || isSaving}
                className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>

              {saveMessage && (
                <div className={`mt-3 p-3 rounded-lg ${
                  saveMessage.includes('success')
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    saveMessage.includes('success') ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {saveMessage}
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
