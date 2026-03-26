export const WelcomeScreen = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-surface text-center px-8 bg-black/50 text-white/60">
    <div className="w-24 h-24 rounded-3xl bg-surface-secondary flex items-center justify-center mb-2 shadow-2xl">
      <img
        className="w-full h-full object-cover shadow-2xl rounded-3xl"
        src="chatHive_white.png"
        alt="Logo"
      />
    </div>
    <div>
      <p className="text-sm mt-1.5 max-w-xs leading-relaxed">
        Select a conversation to start chatting, or start a new one using the
        icons above.
      </p>
    </div>
    <div className="flex items-center gap-2 text-xs mt-2">
      <svg
        className="w-3.5 h-3.5 text-primary-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      </svg>
      End-to-end encrypted messaging
    </div>
  </div>
);
