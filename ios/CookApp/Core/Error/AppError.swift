import Foundation

enum AppError: Error, LocalizedError, Sendable, Equatable {
    case network(message: String)
    case unauthorized
    case decoding
    case configuration(message: String)
    case payment(message: String)
    case cancelled
    case unknown(message: String)

    var errorDescription: String? {
        switch self {
        case .network(let message): message
        case .unauthorized: "Please sign in again."
        case .decoding: "Could not read server response."
        case .configuration(let message): message
        case .payment(let message): message
        case .cancelled: "Cancelled."
        case .unknown(let message): message
        }
    }
}
