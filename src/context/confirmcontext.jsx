import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ConfirmContext = createContext(null);

const defaultDialog = {
  title: 'Are you sure?',
  description: 'Please confirm if you want to continue.',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  tone: 'default'
};

export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const closeDialog = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }

    setDialog(null);
  }, []);

  const confirm = useCallback((options = {}) => {
    setDialog({ ...defaultDialog, ...options });

    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (!dialog) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDialog, dialog]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      {dialog && (
        <div
          className="confirm-overlay"
          role="presentation"
          onClick={() => closeDialog(false)}
        >
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={`confirm-badge confirm-badge-${dialog.tone}`}>
              {dialog.tone === 'danger' ? 'Confirm Action' : 'Please Confirm'}
            </span>
            <h2 id="confirm-dialog-title" className="confirm-title">
              {dialog.title}
            </h2>
            <p id="confirm-dialog-description" className="confirm-description">
              {dialog.description}
            </p>

            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-secondary confirm-cancel-btn"
                onClick={() => closeDialog(false)}
              >
                {dialog.cancelText}
              </button>
              <button
                type="button"
                className={`btn confirm-confirm-btn confirm-confirm-btn-${dialog.tone}`}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error('useConfirm must be used inside ConfirmProvider.');
  }

  return context;
};
