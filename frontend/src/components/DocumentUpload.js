import React, { useState, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import backendService from '../services/backendService';
import { toast } from 'react-toastify';

const DocumentUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    isPublic: false,
    tags: ''
  });
  
  const { currentUser, identity } = useAuth();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size should be less than 10MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateFileHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!currentUser || !identity) {
      setError('You must be logged in to upload files');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate file hash
      const fileHash = await calculateFileHash(file);
      const arrayBuffer = await file.arrayBuffer();
      const fileContent = Array.from(new Uint8Array(arrayBuffer));

      // Create backend service with user's identity
      const service = backendService(process.env.REACT_APP_CANISTER_ID, {
        agentOptions: { identity }
      });

      // Upload file to ICP
      const uploadResult = await service.uploadFile(
        file.name,
        fileContent,
        currentUser.institutionId || '',
        fileHash
      );

      if (uploadResult?.Ok) {
        toast.success('Document uploaded successfully!');
        if (onUploadSuccess) onUploadSuccess();
        setFile(null);
        setMetadata({
          title: '',
          description: '',
          isPublic: false,
          tags: ''
        });
      } else {
        throw new Error(uploadResult?.Err || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage = err.message || 'Failed to upload document';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-upload space-y-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800">Upload Document</h2>
      
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-500">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={metadata.title}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Document title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows="3"
            value={metadata.description}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Document description"
          />
        </div>

        <div className="flex items-center">
          <input
            id="isPublic"
            name="isPublic"
            type="checkbox"
            checked={metadata.isPublic}
            onChange={handleInputChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
            Make this document public
          </label>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            id="tags"
            value={metadata.tags}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="tag1, tag2, tag3"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              !file || loading
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;