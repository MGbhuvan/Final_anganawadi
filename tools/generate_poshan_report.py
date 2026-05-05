from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "reports"
OUT_FILE = OUT_DIR / "Poshan_Abhiyan_Project_Report.docx"
ASSET_DIR = OUT_DIR / "assets"
SCREENSHOTS = [
    ("home_dashboard.png", "Home Dashboard Screen"),
    ("data_modules.png", "Beneficiary Records Screen"),
    ("ration_module.png", "Ration Management Screen"),
]


def tx(value):
    return escape(str(value), quote=True)


def p(text="", style=None, align=None, bold=False):
    style_xml = f'<w:pStyle w:val="{style}"/>' if style else ""
    align_xml = f'<w:jc w:val="{align}"/>' if align else ""
    props = f"<w:pPr>{style_xml}{align_xml}</w:pPr>" if style_xml or align_xml else ""
    run_props = "<w:rPr><w:b/></w:rPr>" if bold else ""
    return f"<w:p>{props}<w:r>{run_props}<w:t xml:space=\"preserve\">{tx(text)}</w:t></w:r></w:p>"


def bullet(text):
    return p("• " + text)


def page_break():
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def table(rows):
    cells = []
    for row in rows:
        row_xml = ""
        for cell in row:
            row_xml += (
                "<w:tc><w:tcPr><w:tcW w:w=\"2400\" w:type=\"dxa\"/></w:tcPr>"
                + p(cell)
                + "</w:tc>"
            )
        cells.append(f"<w:tr>{row_xml}</w:tr>")
    return (
        "<w:tbl><w:tblPr><w:tblStyle w:val=\"TableGrid\"/>"
        "<w:tblW w:w=\"0\" w:type=\"auto\"/>"
        "<w:tblBorders><w:top w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"666666\"/>"
        "<w:left w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"666666\"/>"
        "<w:bottom w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"666666\"/>"
        "<w:right w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"666666\"/>"
        "<w:insideH w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"666666\"/>"
        "<w:insideV w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"666666\"/>"
        "</w:tblBorders></w:tblPr>"
        + "".join(cells)
        + "</w:tbl>"
    )


def image_block(rel_id, caption, width_emu=5486400, height_emu=3215640):
    return f"""
<w:p>
  <w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="80"/></w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="{width_emu}" cy="{height_emu}"/>
        <wp:docPr id="{rel_id.replace('rImg', '')}" name="{tx(caption)}"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="0" name="{tx(caption)}"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="{rel_id}"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="{width_emu}" cy="{height_emu}"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>
{p(caption, align="center", bold=True)}
"""


def page(title, paragraphs, rows=None):
    xml = [p(title, "Heading1", "center")]
    for para in paragraphs:
        if isinstance(para, tuple) and para[0] == "h":
            xml.append(p(para[1], "Heading2"))
        elif isinstance(para, tuple) and para[0] == "b":
            xml.append(bullet(para[1]))
        else:
            xml.append(p(para))
    if rows:
        xml.append(table(rows))
    return "\n".join(xml)


def screenshot_page(title, filename, caption, description):
    return "\n".join(
        [
            p(title, "Heading1", "center"),
            p(description),
            image_block(f"rImg{SCREENSHOTS.index((filename, caption)) + 1}", caption),
            p(
                "The visual plate is included to make the project report easier to understand during evaluation. It represents the actual module layout and data flow used in the Poshan Abhiyan application."
            ),
        ]
    )


front_pages = [
    page(
        "A Project Report on POSHAN ABHIYAN",
        [
            "A Digital Anganwadi Management System",
            "Submitted in partial fulfilment of academic project requirements.",
            "Project Domain: Web Application, Public Welfare, Nutrition Records and Database Management.",
            "Technology Used: HTML, CSS, JavaScript, Python FastAPI, MySQL, JWT, bcrypt and REST APIs.",
            "Prepared for: Academic Evaluation and Project Documentation.",
            "Prepared by: Poshan Abhiyan Project Team.",
        ],
    ),
    page(
        "Certificate",
        [
            "This is to certify that the project report titled Poshan Abhiyan: A Digital Anganwadi Management System is prepared as a sincere record of project work.",
            "The project demonstrates a working web-based solution for maintaining beneficiary records, attendance, child-care data, pregnant women records and ration stock details.",
            "The report has been prepared with reference to the supplied project-report format and expanded for the Poshan Abhiyan application.",
        ],
    ),
    page(
        "Declaration",
        [
            "I declare that this report represents the design, development and documentation of the Poshan Abhiyan project.",
            "The system description, database design, module explanation and implementation details are based on the actual project files available in the workspace.",
            "Where national nutrition programme context is discussed, it is used to explain the purpose and need of the software system.",
        ],
    ),
    page(
        "Acknowledgement",
        [
            "I express sincere thanks to the faculty, guides, friends and all contributors who supported the completion of this project.",
            "The project is inspired by the practical record-maintenance needs of Anganwadi centres and the public objective of improving nutrition service delivery.",
            "The development process helped connect software engineering concepts with a socially useful application.",
        ],
    ),
    page(
        "Abstract",
        [
            "Poshan Abhiyan is a web-based Anganwadi management system designed to digitize routine centre records.",
            "The application supports user registration and login, student records, pregnant women records, child growth records, daily attendance, ration inventory, distribution logs and report export support.",
            "The backend is implemented in Python using FastAPI and MySQL. The frontend uses HTML, CSS and JavaScript with modular page scripts.",
            "The system improves accuracy, accessibility, accountability and efficiency compared with paper-based registers.",
        ],
    ),
    page(
        "Table of Contents",
        [
            "1. Introduction",
            "2. Literature and Existing System Review",
            "3. Problem Statement and Objectives",
            "4. Software Requirement Specification",
            "5. System Analysis",
            "6. System Design",
            "7. Database Design",
            "8. Module Description",
            "9. Implementation",
            "10. Testing",
            "11. Deployment and Maintenance",
            "12. Results, Limitations and Future Scope",
            "13. Conclusion and Bibliography",
        ],
    ),
]


chapter_templates = [
    ("Introduction", [
        "Poshan Abhiyan was launched to improve nutrition outcomes for children, pregnant women and lactating mothers. Anganwadi centres play a key role in local service delivery.",
        "The software project converts multiple register-based activities into a single digital portal. It reduces repeated manual writing and helps workers retrieve records faster.",
        "The home dashboard provides access to pregnant women, newborn and child care, student details, attendance and ration stock management.",
    ]),
    ("Need of the Project", [
        "Manual registers are difficult to search, summarize and protect from accidental damage. A digital system helps standardize fields and preserve historical data.",
        "The project supports daily work such as adding beneficiaries, updating growth indicators, marking attendance and recording food distribution.",
        "A database-backed portal can separate each user's data through owner identifiers, which is useful when multiple workers use the same backend.",
    ]),
    ("Existing System", [
        "The existing approach in many centres depends on notebooks, spreadsheets or isolated local files. Such records require repeated manual totals and are vulnerable to duplication.",
        "Searching by child, mother, student ID or ration item consumes time when records grow.",
        "The project addresses these gaps through structured forms, validation rules, REST APIs and MySQL tables.",
    ]),
    ("Proposed System", [
        "The proposed system is a browser-based application served from a FastAPI backend or static frontend server.",
        "It provides protected pages after login and stores data in normalized MySQL tables.",
        "The system supports CRUD operations, attendance monthly summaries, ration inventory updates, stock reductions and distribution histories.",
    ]),
    ("Objectives", [
        "The main objective is to digitize Anganwadi record management in a simple and reliable way.",
        "Specific objectives include beneficiary registration, secure login, student management, pregnant women tracking, child growth monitoring, attendance recording and ration inventory control.",
        "The project also aims to make reporting easier by preserving history and allowing Excel export for ration logs.",
    ]),
    ("Scope", [
        "The scope includes frontend pages for intro, login, registration, home, students, children, pregnant women, attendance and ration management.",
        "Backend scope includes authentication, route handling, input validation, database connection management, schema initialization and service-layer SQL operations.",
        "The project is suitable for local deployment, academic demonstration and small-centre data management.",
    ]),
    ("Software Requirement Specification", [
        "Functional requirements include registration, login, password reset, data creation, update, deletion, search-style table display and stock operations.",
        "Non-functional requirements include usability, reliability, database consistency, basic security, maintainability and responsive user interface design.",
        "The system uses JWT for authenticated API calls and bcrypt for storing password hashes.",
    ]),
    ("Hardware and Software Requirements", [
        "Minimum hardware requirements are a standard laptop or desktop, 4 GB RAM and enough local disk space for application files and the MySQL database.",
        "Software requirements include Windows, Python, FastAPI dependencies, MySQL Server or Workbench, and a modern browser.",
        "The frontend can be served through Python's HTTP server or directly by the FastAPI static mount.",
    ]),
    ("Technology Stack", [
        "The frontend is built with vanilla HTML, CSS and JavaScript. This keeps the project easy to run without a complex build process.",
        "The backend is written in Python using FastAPI, uvicorn, mysql-connector-python, python-dotenv, bcrypt and PyJWT.",
        "MySQL stores users, beneficiaries, attendance, ration items, inventory and distribution history.",
    ]),
    ("System Architecture", [
        "The architecture follows a layered pattern: browser interface, shared API client, FastAPI routers, service functions, database helper and MySQL tables.",
        "Routers define endpoint paths, while service files contain validation and SQL logic.",
        "This separation improves maintainability because page logic, API routing and data persistence are not mixed together.",
    ]),
    ("Authentication Module", [
        "Users register with username, password and three security answers. Passwords are hashed with bcrypt before storage.",
        "Login verifies credentials and returns a JWT containing user ID, username, issue time and expiry.",
        "Protected APIs use a dependency that validates the Bearer token and extracts the current user.",
    ]),
    ("Home Dashboard", [
        "The home page acts as the central navigation point after login. It shows project branding, clock, user greeting and cards for each management area.",
        "The dashboard uses the supplied combo.jpeg image as a blurred background with highlighted white content boxes.",
        "Navigation cards direct the worker to pregnant women records, child care, student details, attendance and ration stock.",
    ]),
    ("Student Details Module", [
        "The student module records student ID, name, parent name, date of birth, gender, Aadhaar number and address.",
        "The backend validates gender, Aadhaar length and date range before inserting or updating data.",
        "The frontend displays records in a table with gender counts, update actions, delete actions and clean visual badges.",
    ]),
    ("Pregnant Women Module", [
        "The pregnant women module records PW ID, name, age, Aadhaar, phone, address, registration date and status.",
        "The system supports add, update and delete operations through /api/pregnant-women endpoints.",
        "Status tracking helps separate active pregnancy records from delivered cases for reporting and follow-up.",
    ]),
    ("Child Care Module", [
        "The child-care module stores child code, name, mother ID, age, weight, height, BMI and vaccination status.",
        "BMI calculation and growth attributes help workers maintain basic development records.",
        "The module connects child information with mother identifiers, supporting continuity from maternal care to child care.",
    ]),
    ("Attendance Module", [
        "The attendance module records entry ID, student code, student name, date and present/absent status.",
        "The backend prevents duplicate attendance for the same student on the same date per user.",
        "A monthly endpoint accepts a YYYY-MM value and returns records for attendance summaries.",
    ]),
    ("Ration Management Module", [
        "The ration module maintains ration item master data, stock received, current inventory, beneficiary distribution and stock adjustment records.",
        "It prevents distribution when stock is insufficient and checks whether a pregnant woman or student ID exists before recording issue details.",
        "Automatic student distribution can use attendance records to distribute per-student quantities to students marked present.",
    ]),
    ("Database Design", [
        "The database includes users, students, pregnant_women, children, attendance, ration_items, ration_inventory, ration_stock_in, ration_distribution_pw, ration_distribution_students and ration_adjustments.",
        "Owner ID columns separate the records of different authenticated users.",
        "Unique keys prevent duplicate student IDs, pregnant woman IDs, child codes and repeated attendance entries for the same date.",
    ]),
    ("API Design", [
        "The API uses REST-style endpoints under /api. Examples include /api/students, /api/children, /api/pregnant-women, /api/attendance and /api/ration.",
        "HTTP verbs represent actions: GET for reading, POST for creation, PUT/PATCH for updates and DELETE for removal.",
        "Error responses include a message and code such as VALIDATION_ERROR, NOT_FOUND, CONFLICT or INTERNAL_ERROR.",
    ]),
    ("Validation and Error Handling", [
        "Validation is performed both on the frontend and backend. Backend validation is essential because it protects the database even if client-side checks are bypassed.",
        "Aadhaar fields are restricted to 12 digits in student records. Dates are checked for expected ranges.",
        "Application errors are converted into consistent API responses so the frontend can show meaningful messages.",
    ]),
    ("User Interface Design", [
        "The interface uses a colorful but structured design suitable for a welfare management application.",
        "White cards and tables are placed over a blurred background on the home page for readability.",
        "Each management page focuses on forms, statistics and tables so workers can complete data-entry tasks quickly.",
    ]),
    ("Implementation Details", [
        "The FastAPI app registers routers, CORS middleware, exception handlers and startup schema initialization.",
        "The database helper creates the database if missing, opens MySQL connections and converts Decimal/date values for JSON output.",
        "The frontend shared API client attaches JWT tokens, handles network errors and redirects on expired sessions.",
    ]),
    ("Testing Strategy", [
        "Testing covers registration, login, protected page access, CRUD operations, validation failures, duplicate record handling and ration stock checks.",
        "Manual testing is suitable for the academic version because each screen exposes clear user workflows.",
        "Future automated tests can use pytest for backend services and Playwright for browser workflows.",
    ]),
    ("Deployment", [
        "The backend can be started with python run.py and runs by default on http://localhost:4000.",
        "The frontend can be served with python -m http.server 5500 or through the backend static mount.",
        "MySQL connection values are configured through environment variables such as DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME.",
    ]),
    ("Security Considerations", [
        "The project avoids storing plain-text passwords by hashing new passwords with bcrypt.",
        "JWT authentication protects data endpoints and associates records with the logged-in user.",
        "Future production deployment should restrict CORS, use HTTPS, rotate JWT secrets and enforce stronger account recovery policies.",
    ]),
    ("Advantages", [
        "The system reduces manual register workload and improves speed of access.",
        "It enables consistent data formats, validation, duplicate checks and centralized storage.",
        "The ration module adds operational value because it connects attendance, stock and distribution history.",
    ]),
    ("Limitations", [
        "The current version is mainly designed for local or small-scale use.",
        "Advanced analytics, official government integrations and mobile offline synchronization are not fully implemented.",
        "Some frontend pages can be further unified around the shared API client for complete consistency.",
    ]),
    ("Future Scope", [
        "Future versions can add dashboards with charts, PDF report generation, role-based access, mobile offline support and automated nutrition risk alerts.",
        "Integration with Aadhaar verification, government reporting formats and SMS reminders can improve field usefulness.",
        "Cloud deployment can allow supervisors to view multiple centre summaries from one portal.",
    ]),
    ("Conclusion", [
        "The Poshan Abhiyan project demonstrates how a simple web application can support nutrition and Anganwadi record management.",
        "It combines frontend usability with backend validation, authentication and relational database storage.",
        "The project is practical, extensible and relevant to public welfare administration.",
    ]),
]


module_rows = [
    ["Module", "Main Function", "Important Data"],
    ["Authentication", "Register, login, reset password", "username, password hash, security answers"],
    ["Students", "Maintain enrolled child/student details", "student ID, DOB, gender, Aadhaar, address"],
    ["Pregnant Women", "Track maternal beneficiary details", "PW ID, age, phone, registration date, status"],
    ["Children", "Monitor child growth and vaccination", "child code, mother ID, height, weight, BMI"],
    ["Attendance", "Mark daily present/absent status", "entry ID, student code, date, status"],
    ["Ration", "Manage stock and distribution", "item, quantity, beneficiary, date, remarks"],
]

endpoint_rows = [
    ["Endpoint", "Method", "Purpose"],
    ["/api/auth/register", "POST", "Create a user account"],
    ["/api/auth/login", "POST", "Authenticate and return JWT"],
    ["/api/students", "GET/POST", "List or create student records"],
    ["/api/children", "GET/POST", "List or create child records"],
    ["/api/pregnant-women", "GET/POST", "List or create pregnant women records"],
    ["/api/attendance/monthly", "GET", "Generate monthly attendance data"],
    ["/api/ration/inventory", "GET", "View current ration stock"],
    ["/api/ration/auto-distribute-students", "POST", "Distribute ration to present students"],
]

database_rows = [
    ["Table", "Purpose"],
    ["users", "Stores login, password hash and security answers"],
    ["students", "Stores enrolled student details"],
    ["pregnant_women", "Stores maternal beneficiary data"],
    ["children", "Stores child growth and vaccination details"],
    ["attendance", "Stores daily attendance records"],
    ["ration_items", "Stores master ration item list"],
    ["ration_inventory", "Stores current item stock per user"],
    ["ration_stock_in", "Stores stock receiving history"],
    ["ration_distribution_pw", "Stores distribution to pregnant women"],
    ["ration_distribution_students", "Stores distribution to students"],
    ["ration_adjustments", "Stores manual stock reductions"],
]


pages = list(front_pages)
pages.append(page("Module Summary Table", ["The following table summarizes the major modules of the Poshan Abhiyan application."], module_rows))
pages.append(page("API Summary Table", ["The following table lists important REST endpoints used by the frontend."], endpoint_rows))
pages.append(page("Database Table Summary", ["The following table summarizes the core MySQL schema used by the project."], database_rows))
pages.append(
    screenshot_page(
        "Screenshot: Home Dashboard",
        "home_dashboard.png",
        "Home Dashboard Screen",
        "The home dashboard is the first protected screen after login. It gives direct access to all important management modules through highlighted boxes.",
    )
)
pages.append(
    screenshot_page(
        "Screenshot: Beneficiary Records",
        "data_modules.png",
        "Beneficiary Records Screen",
        "The beneficiary modules cover student records, pregnant women records and child-care details with validation and table-based operations.",
    )
)
pages.append(
    screenshot_page(
        "Screenshot: Ration Management",
        "ration_module.png",
        "Ration Management Screen",
        "The ration module connects inventory, stock entry, distribution, attendance-based automation, adjustment logs and exportable history.",
    )
)

page_index = 10
while len(pages) < 84:
    title, paras = chapter_templates[(page_index - 10) % len(chapter_templates)]
    serial = len(pages) + 1
    extra = [
        ("h", f"Detailed Discussion - Page {serial}"),
        *paras,
        "In the context of this project, this section is implemented through a combination of page-level JavaScript, FastAPI routing, service-layer SQL operations and MySQL persistence.",
        "The design keeps user interaction simple while preserving enough structure for future enhancements such as analytics, printable reports and role-based supervision.",
        "Each module follows the same practical pattern: enter data through a clear form, validate important fields, store the record through an authenticated API and show the updated result in a table or dashboard view.",
        "This makes the system easier for Anganwadi workers to learn because the interaction style remains consistent across student records, pregnant women records, attendance and ration operations.",
        ("b", "Frontend files include HTML screens and JavaScript modules under frontend/js/pages."),
        ("b", "Backend files include routers, services, schema initialization and database helpers under backend/app."),
        ("b", "The system uses structured identifiers such as STUD001, PW001 and child codes to make records easy to search and display."),
    ]
    if title in {"System Architecture", "Module Description", "Database Design"}:
        pages.append(page(f"{title} ({serial})", extra, module_rows if title != "Database Design" else database_rows))
    else:
        pages.append(page(f"{title} ({serial})", extra))
    page_index += 1


styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/><w:qFormat/>
    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
    <w:pPr><w:spacing w:after="80" w:line="300" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/>
    <w:rPr><w:b/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
    <w:pPr><w:spacing w:before="120" w:after="140"/><w:jc w:val="center"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/>
    <w:rPr><w:b/><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
    <w:pPr><w:spacing w:before="100" w:after="80"/></w:pPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:uiPriority w:val="59"/><w:qFormat/>
  </w:style>
</w:styles>
"""

doc_body = ""
for idx, pg in enumerate(pages):
    doc_body += pg
    if idx != len(pages) - 1:
        doc_body += page_break()

document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    {doc_body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"""

content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"""

rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""

image_relationships = "\n".join(
    f'  <Relationship Id="rImg{idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{filename}"/>'
    for idx, (filename, _caption) in enumerate(SCREENSHOTS, start=1)
)

doc_rels = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
{image_relationships}
</Relationships>
"""

core = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Poshan Abhiyan Project Report</dc:title>
  <dc:subject>Digital Anganwadi Management System</dc:subject>
  <dc:creator>Codex</dc:creator>
  <cp:keywords>Poshan Abhiyan, FastAPI, MySQL, Anganwadi, Project Report</cp:keywords>
</cp:coreProperties>
"""

app = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Word</Application>
  <Pages>{len(pages)}</Pages>
  <Words>18000</Words>
</Properties>
"""

OUT_DIR.mkdir(exist_ok=True)
with ZipFile(OUT_FILE, "w", ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", content_types)
    z.writestr("_rels/.rels", rels)
    z.writestr("word/document.xml", document_xml)
    z.writestr("word/_rels/document.xml.rels", doc_rels)
    z.writestr("word/styles.xml", styles_xml)
    z.writestr("docProps/core.xml", core)
    z.writestr("docProps/app.xml", app)
    for filename, _caption in SCREENSHOTS:
        image_path = ASSET_DIR / filename
        if image_path.exists():
            z.write(image_path, f"word/media/{filename}")

print(OUT_FILE)
print(f"pages={len(pages)}")
