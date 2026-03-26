export const WelcomeScreen = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-surface text-center px-8">
    <div className="w-24 h-24 rounded-3xl bg-surface-secondary flex items-center justify-center mb-2 shadow-2xl">
      <svg className="w-12 h-12 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
    <div>
      <h2 className="text-xl font-semibold text-gray-200">ChatHive</h2>
      <p className="text-sm text-gray-500 mt-1.5 max-w-xs leading-relaxed">
        Select a conversation to start chatting, or start a new one using the icons above.
      </p>
    </div>
    <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
      <svg className="w-3.5 h-3.5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
      End-to-end encrypted messaging
    </div>
  </div>
);
