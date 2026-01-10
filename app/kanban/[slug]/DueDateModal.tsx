'use client';

interface DueDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dueDate: Date) => void;
  taskTitle: string;
}

export default function DueDateModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
}: DueDateModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dueDateStr = formData.get('dueDate') as string;
    if (dueDateStr) {
      onConfirm(new Date(dueDateStr));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '450px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>
          Set Due Date
        </h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Moving <strong>"{taskTitle}"</strong> to In Progress. Please set an
          estimated due date.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor='dueDate'
              style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}
            >
              Due Date: <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type='date'
              id='dueDate'
              name='dueDate'
              required
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div
            style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
          >
            <button
              type='button'
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              type='submit'
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#0070f3',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
