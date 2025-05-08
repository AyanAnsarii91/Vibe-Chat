// Format timestamp to readable time
export const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Generate avatar initials from username
export const getInitials = (name) => {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

// Get file icon based on mime type
export const getFileIcon = (fileType) => {
  if (!fileType) return 'file';
  
  if (fileType.startsWith('image/')) {
    return 'image';
  } else if (fileType.startsWith('video/')) {
    return 'video';
  } else if (fileType.startsWith('audio/')) {
    return 'headphones';
  } else if (fileType.includes('pdf')) {
    return 'file-pdf';
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return 'file-word';
  } else if (fileType.includes('excel') || fileType.includes('sheet')) {
    return 'file-excel';
  } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
    return 'file-powerpoint';
  } else if (fileType.includes('zip') || fileType.includes('compressed')) {
    return 'file-archive';
  } else {
    return 'file';
  }
};

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

// Check if file is an image
export const isImageFile = (fileType) => {
  return fileType && fileType.startsWith('image/');
};

// Check if file is a video
export const isVideoFile = (fileType) => {
  return fileType && fileType.startsWith('video/');
};

// Generate random avatar color
export const getRandomColor = () => {
  const colors = [
    '#4A6FA5', // primary
    '#166088', // secondary
    '#4FC3DC', // accent
    '#28A745', // success
    '#DC3545', // danger
    '#FFC107', // warning
    '#17A2B8', // info
    '#6C757D', // gray
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

// Debounce function to limit function calls
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};
