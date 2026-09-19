import XCTest

final class DripLabIOSTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testLaunchShowsPrimaryMoodFlow() throws {
        let app = XCUIApplication()
        app.launch()

        if app.buttons["スキップ"].waitForExistence(timeout: 2) {
            app.buttons["スキップ"].tap()
        }

        XCTAssertTrue(app.navigationBars["DripLab"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["今日の一杯を見つける"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["今日の気分"].exists)
    }

    func testBeanCatalogLoadsBundledData() throws {
        let app = XCUIApplication()
        app.launch()

        if app.buttons["スキップ"].waitForExistence(timeout: 2) {
            app.buttons["スキップ"].tap()
        }

        XCTAssertTrue(app.buttons["豆一覧"].waitForExistence(timeout: 5))
        app.buttons["豆一覧"].tap()

        XCTAssertTrue(app.navigationBars["豆一覧"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["347件"].waitForExistence(timeout: 5))
    }

    func testKnowledgeGuidesOpenDetails() throws {
        let app = XCUIApplication()
        app.launch()

        if app.buttons["スキップ"].waitForExistence(timeout: 2) {
            app.buttons["スキップ"].tap()
        }

        XCTAssertTrue(app.buttons["今日の一杯を見つける"].waitForExistence(timeout: 5))
        let knowledgeTab = app.tabBars.buttons["知識"]
        XCTAssertTrue(knowledgeTab.waitForExistence(timeout: 5))
        knowledgeTab.tap()
        XCTAssertTrue(app.staticTexts["コーヒーを知る"].waitForExistence(timeout: 5))

        app.staticTexts["豆の種類"].tap()
        XCTAssertTrue(app.staticTexts["豆の種類"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["アラビカ種"].waitForExistence(timeout: 5))

        app.buttons["knowledge-guide-arabica"].tap()
        XCTAssertTrue(app.staticTexts["アラビカ種"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["概要"].exists)
        XCTAssertTrue(app.staticTexts["DripLabの商品例"].exists)
    }
}
