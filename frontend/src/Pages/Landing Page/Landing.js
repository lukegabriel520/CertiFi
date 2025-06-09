import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Landing.css';


// Importing page components is not strictly needed
// These would be used if use React Router DOM later:
/*
import LoginPage from './Auth/Login Page/Login';A
import SignupPage from './Auth/Signup Page/Signup';
import UserDashboard from './Pages/Dashboard Page/User/UserDashboard';
import InstitutionDashboard from './Pages/Dashboard Page/Institution/InstitutionDashboard';
import VerifierDashboard from './Pages/Dashboard Page/Verifier/VerifierDashboard';
*/


// This is the main component for your Landing.js file
function Landing() { // Renamed from App to Landing
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();


    // State and handlers for the main content area (formerly DynamicWelcomeAndUploadSection)
    const [hoveredCard, setHoveredCard] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);


    const [totalEntries, setTotalEntries] = useState(0);
    const [totalVerified, setTotalVerified] = useState(0);


    const [institutionUsername, setInstitutionUsername] = useState('');
    const [recipientUsername, setRecipientUsername] = useState('');
    const [sendingFile, setSendingFile] = useState(false);
    const [sendError, setSendError] = useState(null);
    const [sendSuccessMessage, setSendSuccessMessage] = useState(null);


    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);


    // Add state for notification bar
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);


    const [showInsertPrompt, setShowInsertPrompt] = useState(false);
    const [tempRecipient, setTempRecipient] = useState('');
    const [tempInstitution, setTempInstitution] = useState('');
    const [insertError, setInsertError] = useState('');


    const faqs = [
        {
            question: "What is CertiFi?",
            answer: "CertiFi is a digital platform designed to help individuals and employers easily certify the authenticity of certificates issued by various institutions that utilizes e-certificates."
        },
        {
            question: "How does CertiFi ensure authenticity?",
            answer: "We make use of blockchain technology! Storing each document each with a unique hash to provide an immutable and verifiable record based on the institution's database of hashes."
        },
        {
            question: "Who can use CertiFi?",
            answer: "It can be used by anyone! May it be students to verify their own certificates or those of others, and by employers to confirm the authenticity of academic and professional documents."
        },
        {
            question: "What type of Documents does CertiFi accept?",
            answer: "For the Beta-released version, it is currently designed to only verify official documents exclusively in PDF format of official records issued by registered institutions."
        }
    ];


    useEffect(() => {
        if (currentUser) {
            setTotalEntries(1234);
            setTotalVerified(567);
        } else {
            setTotalEntries(1234);
            setTotalVerified(567);
        }
    }, [currentUser]);


    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);


    useEffect(() => {
        if (location.state && location.state.scrollTo) {
            const el = document.getElementById(location.state.scrollTo);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);


    const getWelcomeSubText = () => {
        if (!currentUser) return 'Guest!';
        switch (currentUser.role) {
            case 'user': return 'Valued User!';
            case 'verifier': return 'Dedicated Verifier!';
            case 'institution': return 'Esteemed Institution!';
            default: return 'Guest!';
        }
    };


    // Utility function for SHA-256 hashing
    async function getFileHash(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }


    const processMultipleFiles = useCallback(async (files) => {
        if (!currentUser || currentUser.role !== 'institution') return;


        setSendingFile(true);
        try {
            // Generate hashes for all files
            const fileDataArray = await Promise.all(files.map(async file => {
                let hash = '';
                try {
                    hash = await getFileHash(file);
                } catch (err) {
                    hash = 'ErrorHash';
                }
                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadDate: new Date().toISOString(),
                    institutionId: currentUser.uid,
                    hash,
                };
            }));


            // Store the files data in localStorage
            localStorage.setItem('lastUploadedFiles', JSON.stringify(fileDataArray));


            // Navigate to dashboard with state
            navigate('/dashboard/institution', {
                state: {
                    uploadedFiles: fileDataArray,
                    message: `${files.length} files uploaded successfully!`
                }
            });
        } catch (error) {
            console.error('Error processing files:', error);
            setSendError('Error uploading files. Please try again.');
        } finally {
            setSendingFile(false);
        }
    }, [currentUser, navigate]);


    const processFile = useCallback(async (file) => {
        if (!currentUser) {
            handleLoginRequired('upload');
            return;
        }


        if (!file) {
            setUploadError('No file selected.');
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadMessage('');
            setSendError(null);
            setSendSuccessMessage(null);
            setInstitutionUsername('');
            setRecipientUsername('');
            return;
        }


        if (file.type !== 'application/pdf') {
            setUploadError('Only PDF files are accepted.');
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadMessage('');
            setSendError(null);
            setSendSuccessMessage(null);
            setInstitutionUsername('');
            setRecipientUsername('');
            return;
        }


        setUploadMessage('');
        setUploadError('');
        setSendError(null);
        setSendSuccessMessage(null);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));


        // Generate hash for the file
        let hash = '';
        try {
            hash = await getFileHash(file);
        } catch (err) {
            hash = 'ErrorHash';
        }


        // Store hash in state or localStorage as needed
        file.hash = hash;
        // Optionally, you can display or use the hash here


        if (currentUser.role === 'institution') {
            processMultipleFiles([file]);
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUploadMessage(`PDF "${file.name}" loaded. Hash: ${hash}`);
            // No insert prompt for users
        }
    }, [currentUser, processMultipleFiles]);


    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);


    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);


    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);


        if (!currentUser) {
            handleLoginRequired('upload');
            return;
        }


        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (currentUser.role === 'institution') {
                processMultipleFiles(Array.from(e.dataTransfer.files));
            } else {
                processFile(e.dataTransfer.files[0]);
            }
        }
    }, [currentUser, processFile]);


    const handleFileSelect = useCallback((e) => {
        if (!currentUser) {
            handleLoginRequired('upload');
            return;
        }
        if (e.target.files && e.target.files.length > 0) {
            if (currentUser.role === 'institution') {
                processMultipleFiles(Array.from(e.target.files));
            } else {
                processFile(e.target.files[0]);
            }
        }
        e.target.value = null;
    }, [currentUser, processFile]);


    const handleButtonClick = () => {
        if (!currentUser) {
            handleLoginRequired('upload');
            return;
        }
        fileInputRef.current.click();
    };


    const handleInstitutionUsernameChange = (e) => {
        setInstitutionUsername(e.target.value);
    };


    const handleRecipientUsernameChange = (e) => {
        setRecipientUsername(e.target.value);
    };


    const handleSendFile = async () => {
        if (!currentUser) {
            handleLoginRequired('upload');
            return;
        }
        if (currentUser.role === 'user' && !institutionUsername.trim()) {
            setSendError('Please enter an institution username.');
            return;
        }
        if (!recipientUsername.trim()) {
            setSendError('Please enter a recipient username.');
            return;
        }
        if (!selectedFile) {
            setSendError('No file selected to send.');
            return;
        }


        setSendingFile(true);
        setSendError(null);
        setSendSuccessMessage(null);


        await new Promise(resolve => setTimeout(resolve, 2000));
        if (recipientUsername.toLowerCase() === 'fail' || (currentUser.role === 'user' && institutionUsername.toLowerCase() === 'fail')) {
            setSendError('Simulated error: Recipient or Institution not found.');
        } else {
            let message = `File sent to ${recipientUsername} successfully!`;
            if (currentUser.role === 'user') {
                message = `File from ${institutionUsername} sent to ${recipientUsername} successfully!`;
            }
            setSendSuccessMessage(message);
           
            // Store the file data before clearing
            const fileData = {
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type,
                uploadDate: new Date().toISOString(),
                institutionId: currentUser.uid,
                recipient: recipientUsername,
                institution: currentUser.role === 'user' ? institutionUsername : null
            };
           
            // Store in localStorage for dashboard access
            localStorage.setItem('lastSentFile', JSON.stringify(fileData));
           
            // Clear the form
            setSelectedFile(null);
            setPreviewUrl(null);
            setInstitutionUsername('');
            setRecipientUsername('');
            setUploadMessage('');
           
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate(`/dashboard/${currentUser.role}`, {
                    state: {
                        sentFile: fileData,
                        message: message
                    }
                });
            }, 1500);
        }
        setSendingFile(false);
    };


    const handleMassFileSelect = useCallback((e) => {
        if (!currentUser || currentUser.role !== 'institution') {
            alert('Only institutions can use mass upload.');
            return;
        }


        try {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                // Clean up previous preview URL if it exists
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
               
                setSelectedFiles(files);
                const newPreviewUrl = URL.createObjectURL(files[0]);
                setPreviewUrl(newPreviewUrl);
            }
        } catch (error) {
            console.error('Error handling file selection:', error);
            setSendError('Error selecting files. Please try again.');
        } finally {
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [currentUser, previewUrl]);


    const handleMassUpload = async () => {
        if (!currentUser || currentUser.role !== 'institution') return;
       
        setUploadingFiles(true);
        setUploadProgress(0);
       
        try {
            // Simulate upload progress
            for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                setUploadProgress(i);
            }
           
            setUploadingFiles(false);
            setSendSuccessMessage(`${selectedFiles.length} files uploaded to database successfully!`);
           
            // Clean up preview URL
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
           
            // Clear selected files and preview
            setSelectedFiles([]);
            setPreviewUrl(null);
           
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard/institution');
            }, 2000);
        } catch (error) {
            console.error('Error during mass upload:', error);
            setUploadingFiles(false);
            setSendError('Error uploading files. Please try again.');
        }
    };


    const handleInsertAnotherDocument = () => {
        try {
            // Clean up preview URL
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
           
            setSelectedFile(null);
            setSelectedFiles([]);
            setPreviewUrl(null);
            setUploadMessage('');
            setUploadError('');
            setSendError(null);
            setSendSuccessMessage(null);
            setInstitutionUsername('');
            setRecipientUsername('');
           
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error cleaning up document:', error);
        }
    };


    const getNavLinks = () => {
        if (currentUser) {
            return (
                <>
                    <Link to={`/dashboard/${currentUser.role}`} className="nav-link">Dashboard</Link>
                    <a href="#how-it-works-section" className="nav-link">How it works</a>
                    <a href="#faq-section" className="nav-link">FAQ</a>
                    <a href="#contact-us-section" className="nav-link">Contact Us</a>
                    <Link to="/" onClick={logout} className="nav-link logout-link">Logout</Link>
                </>
            );
        } else {
            return (
                <>
                    <a href="#" className="nav-link" onClick={(e) => {
                        e.preventDefault();
                        handleLoginRequired('dashboard');
                    }}>Dashboard</a>
                    <a href="#how-it-works-section" className="nav-link">How it works</a>
                    <a href="#faq-section" className="nav-link">FAQ</a>
                    <a href="#contact-us-section" className="nav-link">Contact Us</a>
                    <Link to="/login" className="nav-link logout-link">Login</Link>
                </>
            );
        }
    };


    const getInstitutionIcon = () => {
        if (!currentUser) return 'fas fa-globe';
        switch (currentUser.role) {
            case 'user': return 'fas fa-user';
            case 'verifier': return 'fas fa-check-circle';
            case 'institution': return 'fas fa-building';
            default: return 'fas fa-globe';
        }
    };


    const getInstitutionHeaderText = () => {
        if (!currentUser) return 'Guest';
        switch (currentUser.role) {
            case 'user': return 'User';
            case 'verifier': return 'Verifier';
            case 'institution': return 'Institution';
            default: return 'Guest';
        }
    };


    // Add cleanup effect for selected files
    useEffect(() => {
        return () => {
            setSelectedFiles([]);
            setSelectedFile(null);
        };
    }, []);


    // Add notification bar component
    const LoginPrompt = () => {
        if (!showLoginPrompt) return null;


        return (
            <div className="login-prompt-overlay">
                <div className="login-prompt-container">
                    <div className="login-prompt-content">
                        <h3>Login Required</h3>
                        <p>Please login first to upload a document...</p>
                        <div className="login-prompt-buttons">
                            <button
                                className="action-button secondary-button"
                                onClick={() => {
                                    setShowLoginPrompt(false);
                                    setPendingAction(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="action-button primary-button"
                                onClick={handleLoginPromptAction}
                            >
                                Proceed to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    const handleLoginRequired = (action) => {
        setPendingAction(action);
        setShowLoginPrompt(true);
    };


    // Add a function to handle the login prompt action
    const handleLoginPromptAction = () => {
        setShowLoginPrompt(false);
        if (pendingAction === 'dashboard') {
            navigate('/login');
        } else if (pendingAction === 'view') {
            navigate('/login');
        } else if (pendingAction === 'upload') {
            navigate('/login');
        }
        setPendingAction(null);
    };


    // Modify the handlers to use the new login prompt
    const handleViewCertificates = () => {
        if (!currentUser) {
            handleLoginRequired('view');
        } else {
            navigate(`/dashboard/${currentUser.role}`);
        }
    };


    const handleFileAreaClick = () => {
        if (!currentUser) {
            handleLoginRequired('upload');
        }
    };


    return (
        <div className="app-container">
            <LoginPrompt />
            <nav className="main-nav-bar">
                <div className="logo-container">
                    <Link to="/" className="logo-link">
                        <img src="/CertiFi_Logo.png" alt="CertiFi Logo" className="logo-image" />
                        <p className="logo-text">CertiFi</p>
                    </Link>
                </div>
                <div className="nav-links">
                    {getNavLinks()}
                </div>
            </nav>


            <div className="institution-header-container">
                <div className="institution-header">
                    <i className={getInstitutionIcon() + " institution-icon"}></i>
                    <span className="institution-text">{getInstitutionHeaderText()}</span>
                </div>
            </div>


            <main className="main-content-area">
                <div className="content-wrapper">
                    <div className="left-section">
                        <h1 className="welcome-heading">
                            <span className="welcome-main-text">Welcome,</span> <br />
                            <span className="welcome-sub-text">{getWelcomeSubText()}</span>
                        </h1>
                        <p className="welcome-paragraph">
                            Manage and issue your academic certificates with ease. <br /> Oversee all verification requests in one place.
                        </p>
                        <div className="action-buttons-container">
                            <button className="action-button primary-button" onClick={handleViewCertificates}>
                                View All Certificates
                            </button>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <p className="stat-label">Total Certificate Entries</p>
                                <span className="stat-value gradient-text">{totalEntries.toLocaleString()}</span>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label">Total Certificates Verified</p>
                                <span className="stat-value gradient-text">{totalVerified.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>


                    <div
                        className={`right-section ${isDragging ? 'dragging-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleFileAreaClick}
                    >
                        {!selectedFile && !selectedFiles.length ? (
                            <div className="right-content-block initial-state-content">
                                {currentUser?.role === 'institution' ? (
                                    <>
                                        <div className="drop-zone-icon-container">
                                            <i className="fas fa-cloud-upload-alt drop-zone-icon"></i>
                                        </div>
                                        <p className="drop-zone-text-primary">
                                            Drag and drop multiple PDF certificates
                                        </p>
                                        <p className="drop-zone-text-secondary">
                                            or select multiple files
                                        </p>
                                        <div className="separator-container">
                                            <div className="separator-line"></div>
                                            <span className="separator-text">or</span>
                                            <div className="separator-line"></div>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleFileSelect}
                                            accept=".pdf"
                                            multiple
                                        />
                                        <div className="select-file">
                                            <button className="action-button primary-button" onClick={handleButtonClick}>
                                                Select Multiple PDF Files
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="drop-zone-icon-container">
                                            <i className="fas fa-cloud-upload-alt drop-zone-icon"></i>
                                        </div>
                                        <p className="drop-zone-text-primary">
                                            Drag and drop your PDF certificate
                                        </p>
                                        <p className="drop-zone-text-secondary">
                                            to view its contents
                                        </p>
                                        <div className="separator-container">
                                            <div className="separator-line"></div>
                                            <span className="separator-text">or</span>
                                            <div className="separator-line"></div>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleFileSelect}
                                            accept=".pdf"
                                        />
                                        <div className="select-file">
                                            <button className="action-button primary-button" onClick={handleButtonClick}>
                                                Select PDF File
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : selectedFiles.length > 0 ? (
                            <div className="right-content-block file-selected-content">
                                <div className="file-preview-container">
                                    <object data={previewUrl} type="application/pdf" className="pdf-preview-object">
                                        <p className="pdf-viewer-fallback-text">
                                            Your browser does not support inline PDFs. <a href={previewUrl} target="_blank" rel="noopener noreferrer">Download PDF</a>
                                        </p>
                                    </object>
                                    <p className="file-name-display">Preview of first file: {selectedFiles[0].name}</p>
                                    <p className="file-count-display">Total files selected: {selectedFiles.length}</p>
                                </div>


                                <div className="upload-to-db-section">
                                    <h3 className="upload-section-title">Mass Upload to Database</h3>
                                    {uploadingFiles ? (
                                        <div className="upload-progress">
                                            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                                            <p className="upload-message">Uploading files... {uploadProgress}%</p>
                                        </div>
                                    ) : (
                                        <>
                                            {sendSuccessMessage && <p className="upload-message success">{sendSuccessMessage}</p>}
                                            {sendError && <p className="upload-message error">{sendError}</p>}
                                            <button
                                                className="action-button primary-button"
                                                onClick={handleMassUpload}
                                                disabled={uploadingFiles}
                                            >
                                                Upload All Files
                                            </button>
                                        </>
                                    )}
                                </div>


                                <div className="separator-container">
                                    <div className="separator-line"></div>
                                    <span className="separator-text">or</span>
                                    <div className="separator-line"></div>
                                </div>
                                <button className="action-button primary-button" onClick={handleInsertAnotherDocument}>
                                    Select Different Files
                                </button>
                            </div>
                        ) : (
                            <div key="file-preview-send-ui" className="right-content-block file-selected-content">
                                <div className="file-preview-container">
                                    <object data={previewUrl} type="application/pdf" className="pdf-preview-object">
                                        <p className="pdf-viewer-fallback-text">
                                            Your browser does not support inline PDFs. <a href={previewUrl} target="_blank" rel="noopener noreferrer">Download PDF</a>
                                        </p>
                                    </object>
                                    <p className="file-name-display">{selectedFile.name}</p>
                                    <p className="file-size-display">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                </div>


                                {currentUser.role !== 'institution' ? (
                                    <div className="send-section">
                                        <h3 className="send-section-title">Send Certificate</h3>
                                        {currentUser.role === 'user' && (
                                            <div className="form-group send-input-group">
                                                <label htmlFor="institutionUsername">Institution Username</label>
                                                <div style={{ position: 'relative' }}>
                                                    <i className="fa-solid fa-building" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#60a5fa', fontSize: '1.1rem', pointerEvents: 'none' }}></i>
                                                    <input
                                                        type="text"
                                                        id="institutionUsername"
                                                        className="send-recipient-input"
                                                        placeholder="Enter institution username"
                                                        value={institutionUsername}
                                                        onChange={handleInstitutionUsernameChange}
                                                        disabled={sendingFile}
                                                        style={{ paddingLeft: '2.5rem' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="form-group send-input-group">
                                            <label htmlFor="recipientUsername">Verifier Username</label>
                                            <div style={{ position: 'relative' }}>
                                                <i className="fa-solid fa-user-check" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#60a5fa', fontSize: '1.1rem', pointerEvents: 'none' }}></i>
                                                <input
                                                    type="text"
                                                    id="recipientUsername"
                                                    className="send-recipient-input"
                                                    placeholder="Enter verifier username"
                                                    value={recipientUsername}
                                                    onChange={handleRecipientUsernameChange}
                                                    disabled={sendingFile}
                                                    style={{ paddingLeft: '2.5rem' }}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            className="action-button primary-button send-button"
                                            onClick={handleSendFile}
                                            disabled={sendingFile}
                                        >
                                            {sendingFile ? 'Sending...' : 'Send File'}
                                        </button>
                                        {sendError && <p className="send-message error">{sendError}</p>}
                                        {sendSuccessMessage && <p className="send-message success">{sendSuccessMessage}</p>}
                                    </div>
                                ) : (
                                    <div className="upload-to-db-section">
                                        <h3 className="upload-section-title">Reference to Database</h3>
                                        {sendingFile ? (
                                            <p className="upload-message">Uploading to database...</p>
                                        ) : (
                                            <>
                                                {sendSuccessMessage && <p className="upload-message success">{sendSuccessMessage}</p>}
                                                {sendError && <p className="upload-message error">{sendError}</p>}
                                            </>
                                        )}
                                    </div>
                                )}




                                <div className="separator-container">
                                    <div className="separator-line"></div>
                                    <span className="separator-text">or</span>
                                    <div className="separator-line"></div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelect}
                                    accept=".pdf"
                                />
                                {currentUser.role === 'institution' ? (
                                    <button className="action-button primary-button" onClick={handleInsertAnotherDocument}>
                                        Insert Another Document
                                    </button>
                                ) : (
                                    <button className="action-button primary-button" onClick={handleButtonClick}>
                                        Change File
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>


            {/* How it works section */}
            <div className="container" id="how-it-works-section">
                <h2 className="section-title">How it works</h2>
                <div className="how-it-works-grid">
                    <div className="how-it-works-step">
                        <div className="how-it-works-icon blue-background">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                        <h3 className="step-title">1. Insert</h3>
                        <p className="step-description">
                            Drag and drop your certificate file into the add file section.
                        </p>
                    </div>
                    <div className="how-it-works-step">
                        <div className="how-it-works-icon purple-background">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h3 className="step-title">2. Verify</h3>
                        <p className="step-description">
                            Verify document legitimacy against institutional databases using a hashcode.
                        </p>
                    </div>
                    <div className="how-it-works-step">
                        <div className="how-it-works-icon green-background">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4-4m4 4l-4-4m4 4H9"></path></svg>
                        </div>
                        <h3 className="step-title">3. Check</h3>
                        <p className="step-description">
                            Validate submitted data to confirm it's an authentic institutional document.
                        </p>
                    </div>
                </div>
            </div>


            {/* FAQ section */}
            <div className="container" id="faq-section">
                <h2 className="section-title">Frequently Asked Questions</h2>
                <div className="faq-grid">
                    {faqs.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <h3 className="faq-question">{faq.question}</h3>
                            <p className="faq-answer">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>


            {/* Contact Us section */}
            <div className="container" id="contact-us-section">
                <h2 className="section-title">Contact Us</h2>
                <div className="contact-grid">
                    <div
                        className="contact-card"
                        onMouseEnter={() => setHoveredCard('employer')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="contact-icon blue-text">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="contact-card-title">Are you a Verifier?</h3>
                        <div className={`contact-details ${hoveredCard === 'employer' ? 'visible' : ''}`}>
                            <p>Email: verifiers@certifi.com</p>
                            <p>Phone: +63 (960) 292-7133</p>
                            <p>For inquiries regarding getting validated, overall orientation, and account creation.</p>
                        </div>
                    </div>
                    <div
                        className="contact-card"
                        onMouseEnter={() => setHoveredCard('institution')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <div className="contact-icon green-text">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M5 12h.01M5 15h.01M5 18h.01M9 7h1m-1 4h1m-1 4h1m4-10h1m-1 4h1m-1 4h1"></path></svg>
                        </div>
                        <h3 className="contact-card-title">Are you an Institution?</h3>
                        <div className={`contact-details ${hoveredCard === 'institution' ? 'visible' : ''}`}>
                            <p>Email: institutions@certifi.com</p>
                            <p>Phone: +63 (960) 292-7133</p>
                            <p>For inquiries regarding potential partnerships, overall orientation, and account creation.</p>
                        </div>
                    </div>
                </div>
            </div>


            <footer className="footer">
                <div className="footer-content">
                    <p className="footer-text">© 2025 CertiFi.</p>
                </div>
            </footer>
        </div>
    );
}

export default Landing;


