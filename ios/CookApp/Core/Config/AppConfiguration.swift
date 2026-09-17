import Foundation

enum AppEnvironment: String, Sendable {
    case debug
    case staging
    case production
}

struct AppConfiguration: Sendable {
    let environment: AppEnvironment
    let supabaseURL: URL
    let supabaseAnonKey: String
    let revenueCatAPIKey: String
    let googleClientID: String

    static func fromBundle() -> AppConfiguration {
        let envName = Bundle.main.object(forInfoDictionaryKey: "COOKAPP_ENVIRONMENT") as? String
        let environment = AppEnvironment(rawValue: envName ?? "debug") ?? .debug

        let supabaseURLString = Bundle.main.object(forInfoDictionaryKey: "COOKAPP_SUPABASE_URL") as? String
            ?? "https://semsjyrqjnumpvanibip.supabase.co"
        let supabaseAnonKey = Bundle.main.object(forInfoDictionaryKey: "COOKAPP_SUPABASE_ANON_KEY") as? String
            ?? "REPLACE_WITH_SUPABASE_ANON_KEY"
        let revenueCatAPIKey = Bundle.main.object(forInfoDictionaryKey: "COOKAPP_REVENUECAT_API_KEY") as? String
            ?? "REPLACE_WITH_REVENUECAT_API_KEY"
        let googleClientID = Bundle.main.object(forInfoDictionaryKey: "COOKAPP_GOOGLE_CLIENT_ID") as? String
            ?? "REPLACE_WITH_GOOGLE_CLIENT_ID"

        guard let supabaseURL = URL(string: supabaseURLString) else {
            preconditionFailure("Invalid COOKAPP_SUPABASE_URL")
        }

        return AppConfiguration(
            environment: environment,
            supabaseURL: supabaseURL,
            supabaseAnonKey: supabaseAnonKey,
            revenueCatAPIKey: revenueCatAPIKey,
            googleClientID: googleClientID
        )
    }
}
