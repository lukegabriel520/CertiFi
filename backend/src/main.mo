import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor CertifiBackend {
    // Types
    type FileDetails = {
        fileName: Text;
        fileHash: Text;
        uploadTime: Int;
        fileContent: [Nat8];
        institutionId: Text;
    };

    type UserFileDetails = {
        fileName: Text;
        fileContent: [Nat8];
        uploadTime: Int;
        userId: Text;
        docName: Text;
        issuer: Text;
        owner: Text;
        status: Text;
    };

    // State
    private stable var fileCounter: Nat = 0;
    private stable var userFileCounter: Nat = 0;
    private var files = HashMap.HashMap<Nat, FileDetails>(0, Nat.equal, func(n) { Nat32.fromNat(n) });
    private var userFiles = HashMap.HashMap<Nat, UserFileDetails>(0, Nat.equal, func(n) { Nat32.fromNat(n) });

    // Institution File Functions
    public shared(msg) func uploadFile(
        fileName: Text,
        fileContent: [Nat8],
        institutionId: Text,
        fileHash: Text
    ) : async { fileId: Nat } {
        let caller = Principal.toText(msg.caller);
        
        let fileId = fileCounter;
        fileCounter += 1;

        let fileDetails: FileDetails = {
            fileName = fileName;
            fileHash = fileHash;
            uploadTime = Time.now();
            fileContent = fileContent;
            institutionId = institutionId;
        };

        files.put(fileId, fileDetails);

        return {
            fileId = fileId;
        };
    };

    public query func getFileDetails(fileId: Nat) : async ?FileDetails {
        return files.get(fileId);
    };

    public query func getInstitutionFiles(institutionId: Text) : async [FileDetails] {
        let institutionFiles = Buffer.Buffer<FileDetails>(0);
        
        for ((_, file) in files.entries()) {
            if (file.institutionId == institutionId) {
                institutionFiles.add(file);
            };
        };

        return Buffer.toArray(institutionFiles);
    };

    public query func downloadFile(fileId: Nat) : async ?[Nat8] {
        switch (files.get(fileId)) {
            case (?file) {
                return ?file.fileContent;
            };
            case null {
                return null;
            };
        };
    };

    public shared(msg) func deleteFile(fileId: Nat) : async Bool {
        let caller = Principal.toText(msg.caller);
        
        switch (files.get(fileId)) {
            case (?file) {
                if (file.institutionId == caller) {
                    files.delete(fileId);
                    return true;
                };
                return false;
            };
            case null {
                return false;
            };
        };
    };

    // User File Functions
    public shared(msg) func uploadUserFile(
        fileName: Text,
        fileContent: [Nat8],
        userId: Text,
        docName: Text,
        issuer: Text,
        owner: Text
    ) : async { fileId: Nat } {
        let caller = Principal.toText(msg.caller);
        
        let fileId = userFileCounter;
        userFileCounter += 1;

        let userFileDetails: UserFileDetails = {
            fileName = fileName;
            fileContent = fileContent;
            uploadTime = Time.now();
            userId = userId;
            docName = docName;
            issuer = issuer;
            owner = owner;
            status = "Pending";
        };

        userFiles.put(fileId, userFileDetails);

        return {
            fileId = fileId;
        };
    };

    public query func getUserFileDetails(fileId: Nat) : async ?UserFileDetails {
        return userFiles.get(fileId);
    };

    public query func getUserFiles(userId: Text) : async [UserFileDetails] {
        let userFileList = Buffer.Buffer<UserFileDetails>(0);
        
        for ((_, file) in userFiles.entries()) {
            if (file.userId == userId) {
                userFileList.add(file);
            };
        };

        return Buffer.toArray(userFileList);
    };

    public query func downloadUserFile(fileId: Nat) : async ?[Nat8] {
        switch (userFiles.get(fileId)) {
            case (?file) {
                return ?file.fileContent;
            };
            case null {
                return null;
            };
        };
    };
}

