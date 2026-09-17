import Foundation

enum MonitoringLevel: String, Sendable {
    case debug
    case info
    case warning
    case error
}

protocol MonitoringService: Sendable {
    func configure(environment: AppEnvironment)
    func log(level: MonitoringLevel, message: String)
    func track(event: String, properties: [String: String])
}

extension MonitoringService {
    func track(event: String) {
        track(event: event, properties: [:])
    }
}

/// Phase 1 stub — swap for Crashlytics/Sentry/Analytics later without touching features.
struct ConsoleMonitoringService: MonitoringService {
    func configure(environment: AppEnvironment) {
        log(level: .info, message: "Monitoring configured for \(environment.rawValue)")
    }

    func log(level: MonitoringLevel, message: String) {
        print("[CookApp][\(level.rawValue)] \(message)")
    }

    func track(event: String, properties: [String: String]) {
        print("[CookApp][event] \(event) \(properties)")
    }
}
