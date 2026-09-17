import Foundation

protocol NetworkClient: Sendable {
    func data(for request: URLRequest) async throws -> (Data, HTTPURLResponse)
}

struct URLSessionNetworkClient: NetworkClient {
    let baseURL: URL
    private let session: URLSession

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    func data(for request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw AppError.network(message: "Invalid HTTP response.")
            }
            return (data, http)
        } catch let error as AppError {
            throw error
        } catch is CancellationError {
            throw AppError.cancelled
        } catch {
            throw AppError.network(message: error.localizedDescription)
        }
    }

    func makeRequest(
        path: String,
        method: String = "GET",
        headers: [String: String] = [:],
        body: Data? = nil
    ) -> URLRequest {
        let url = baseURL.appending(path: path)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
        return request
    }
}
