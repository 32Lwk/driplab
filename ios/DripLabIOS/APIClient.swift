import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case server(String)
    case transport(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: "API URLが正しくありません"
        case .server(let message): message
        case .transport(let message): message
        }
    }
}

struct APIClient {
    var baseURL: URL
    var session: URLSession = .shared

    func recommend(_ request: RecommendRequest) async throws -> RecommendResponse {
        try await post(path: "/api/recommend", body: request)
    }

    func pair(_ request: PairingRequest) async throws -> PairingResponse {
        try await post(path: "/api/pair", body: request)
    }

    func readjustMood(_ request: ReadjustRequest) async throws -> ReadjustResponse {
        try await post(path: "/api/readjust", body: request)
    }

    func readjustPairing(_ request: ReadjustRequest) async throws -> ReadjustPairingResponse {
        try await post(path: "/api/readjust", body: request)
    }

    private func post<Request: Encodable, Response: Decodable>(
        path: String,
        body: Request
    ) async throws -> Response {
        guard let url = URL(string: path, relativeTo: baseURL)?.absoluteURL else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        request.timeoutInterval = 20

        do {
            let (data, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.transport("サーバー応答を確認できませんでした")
            }
            guard (200..<300).contains(httpResponse.statusCode) else {
                let error = try? JSONDecoder().decode(ServerError.self, from: data)
                throw APIError.server(error?.error ?? "提案の取得に失敗しました")
            }
            return try JSONDecoder().decode(Response.self, from: data)
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.transport(error.localizedDescription)
        }
    }
}

private struct ServerError: Decodable {
    let error: String
}
