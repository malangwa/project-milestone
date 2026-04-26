interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
};