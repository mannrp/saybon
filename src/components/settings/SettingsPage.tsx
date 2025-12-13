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
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mb-4"></div>
          <p className="text-lg text-[var(--color-text-secondary)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-8 text-center">
          Settings
        </h1>

        <div className="bg-[var(--color-bg-card)] rounded-lg shadow-md p-6 border border-[var(--color-border)]">
          <form onSubmit={handleSave} className="space-y-6">
            {/* AI Provider Section */}
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                AI Provider
              </h2>
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] mb-4">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <strong>MVP:</strong> Currently only Google Gemini is supported.
                  Get your free API key at{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
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
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
              >
                Gemini API Key
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>

            {/* Model Selector */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Model
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              >
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Faster, Free)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Better Quality)</option>
              </select>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Flash Lite is faster and free. Flash provides better quality responses.
              </p>
            </div>

            {/* Test Connection Button */}
            <div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!apiKey.trim() || isTesting}
                className="w-full px-6 py-3 text-lg font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] rounded-lg hover:bg-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[var(--color-border)]"
              >
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>

              {testResult === 'success' && (
                <div className="mt-3 p-3 bg-[var(--color-correct-bg)] border border-[var(--color-correct-border)] rounded-lg">
                  <p className="text-sm text-[var(--color-correct-text)] flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Connection successful!
                  </p>
                </div>
              )}

              {testResult === 'error' && (
                <div className="mt-3 p-3 bg-[var(--color-incorrect-bg)] border border-[var(--color-incorrect-border)] rounded-lg">
                  <p className="text-sm text-[var(--color-incorrect-text)] flex items-center">
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
                className="w-full px-6 py-3 text-lg font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>

              {saveMessage && (
                <div className={`mt-3 p-3 rounded-lg ${
                  saveMessage.includes('success')
                    ? 'bg-[var(--color-correct-bg)] border border-[var(--color-correct-border)]'
                    : 'bg-[var(--color-incorrect-bg)] border border-[var(--color-incorrect-border)]'
                }`}>
                  <p className={`text-sm ${
                    saveMessage.includes('success') ? 'text-[var(--color-correct-text)]' : 'text-[var(--color-incorrect-text)]'
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
