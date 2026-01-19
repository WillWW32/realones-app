const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, BorderStyle, WidthType, ShadingType, AlignmentType,
        PageBreak } = require('docx');
const fs = require('fs');

// App Store Connect Required Fields Template
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 48, bold: true, font: "Arial", color: "1a1a1a" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "333333" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "444444" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Title
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "REALones - App Store Submission Content", bold: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Copy and paste these fields into App Store Connect", italics: true, color: "666666" })]
      }),
      new Paragraph({ children: [] }),

      // ==================== APP INFORMATION ====================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("1. App Information")]
      }),

      // App Name
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("App Name (30 characters max)")]
      }),
      createCopyBox("REALones"),

      // Subtitle
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Subtitle (30 characters max)")]
      }),
      createCopyBox("Connect with your real ones"),

      // Primary Category
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Primary Category")]
      }),
      createCopyBox("Social Networking"),

      // Secondary Category (optional)
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Secondary Category (optional)")]
      }),
      createCopyBox("Lifestyle"),

      new Paragraph({ children: [new PageBreak()] }),

      // ==================== VERSION INFORMATION ====================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("2. Version Information")]
      }),

      // Description
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Description (4000 characters max)")]
      }),
      createCopyBox(`REALones is the social app for your inner circle - the people who matter most.

In a world of endless followers and superficial connections, REALones brings you back to what matters: genuine relationships with your closest friends and family.

KEY FEATURES:

• Private Circles - Create intimate groups for your real ones only
• Authentic Sharing - Share moments without the pressure of public posts
• No Algorithms - See everything from your circle, in chronological order
• Privacy First - Your data stays yours, always

WHY REALones?

We believe social media should bring you closer to the people you care about, not distract you with content from strangers. REALones strips away the noise and focuses on meaningful connections.

Perfect for:
- Close friend groups
- Family circles
- Small communities
- Anyone tired of traditional social media

Join REALones and reconnect with your real ones today.`),

      new Paragraph({ children: [new PageBreak()] }),

      // Keywords
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Keywords (100 characters max, comma-separated)")]
      }),
      createCopyBox("social,friends,family,private,circle,group,chat,share,authentic,real"),

      // Promotional Text
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Promotional Text (170 characters max) - Can be updated without new build")]
      }),
      createCopyBox("Connect with your inner circle. Share authentic moments with the people who matter most. No algorithms, no strangers - just your real ones."),

      // What's New
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("What's New in This Version")]
      }),
      createCopyBox(`Welcome to REALones!

This is our initial release featuring:
• Create and join private circles
• Share photos and updates with your real ones
• Apple Sign-In for easy, secure access
• Clean, distraction-free interface

We're excited to help you connect with the people who matter most!`),

      new Paragraph({ children: [new PageBreak()] }),

      // ==================== SUPPORT & CONTACT ====================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("3. Support & Contact URLs")]
      }),

      // Support URL
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Support URL (Required)")]
      }),
      createCopyBox("https://realones.app/support"),
      new Paragraph({
        children: [new TextRun({ text: "Note: Create this page with FAQ, contact form, or email address", italics: true, color: "888888", size: 20 })]
      }),

      // Marketing URL
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Marketing URL (Optional)")]
      }),
      createCopyBox("https://realones.app"),

      // Privacy Policy URL
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Privacy Policy URL (Required)")]
      }),
      createCopyBox("https://realones.app/privacy"),
      new Paragraph({
        children: [new TextRun({ text: "Note: Must be a publicly accessible privacy policy", italics: true, color: "888888", size: 20 })]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ==================== APP REVIEW INFORMATION ====================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("4. App Review Information")]
      }),

      // Contact Info
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Contact First Name")]
      }),
      createCopyBox("William"),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Contact Last Name")]
      }),
      createCopyBox("Boone"),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Contact Phone")]
      }),
      createCopyBox("406-926-9950"),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Contact Email")]
      }),
      createCopyBox("jesse@entreartists.com"),

      // Demo Account (if sign-in required)
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Demo Account Username (if app requires sign-in)")]
      }),
      createCopyBox("reviewer@realones.app"),
      new Paragraph({
        children: [new TextRun({ text: "Note: Create a test account for Apple reviewers if your app requires authentication", italics: true, color: "888888", size: 20 })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Demo Account Password")]
      }),
      createCopyBox("ReviewTest2026!"),

      // Review Notes
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("Notes for Review (Optional but recommended)")]
      }),
      createCopyBox(`Thank you for reviewing REALones!

To test the app:
1. Sign in using Apple Sign-In (or use the demo account provided)
2. You can create a new circle or explore the sample circle
3. Try sharing a photo or text update

The app requires Apple Sign-In for authentication. A demo account is provided above if needed.

Please contact us if you have any questions during the review process.`),

      new Paragraph({ children: [new PageBreak()] }),

      // ==================== REQUIRED PAGES TO CREATE ====================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("5. Required Web Pages to Create")]
      }),

      new Paragraph({
        children: [new TextRun({ text: "You need to create these pages before submission:", bold: true })]
      }),
      new Paragraph({ children: [] }),

      // Privacy Policy
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Privacy Policy Page")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "URL: https://realones.app/privacy", bold: true })]
      }),
      new Paragraph({ children: [] }),
      createCopyBox(`Privacy Policy for REALones

Last updated: January 18, 2026

1. INFORMATION WE COLLECT

We collect information you provide directly:
- Account information (name, email via Apple Sign-In)
- Content you share (photos, text posts)
- Circle membership information

2. HOW WE USE YOUR INFORMATION

We use your information to:
- Provide and maintain the app
- Enable you to connect with your circles
- Send important notifications about the service

3. INFORMATION SHARING

We do not sell your personal information. We share data only:
- With your consent
- To comply with legal obligations
- To protect our rights and safety

4. DATA SECURITY

We implement industry-standard security measures to protect your data.

5. YOUR RIGHTS

You can:
- Access your personal data
- Request deletion of your account
- Export your data

6. CONTACT US

For privacy questions: privacy@realones.app

7. CHANGES TO THIS POLICY

We may update this policy and will notify you of significant changes.`),

      new Paragraph({ children: [new PageBreak()] }),

      // Support Page
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Support Page")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "URL: https://realones.app/support", bold: true })]
      }),
      new Paragraph({ children: [] }),
      createCopyBox(`REALones Support

Need help? We're here for you.

FREQUENTLY ASKED QUESTIONS

Q: How do I create a circle?
A: Tap the + button on the home screen and select "Create Circle."

Q: How do I invite friends?
A: Open your circle, tap the settings icon, and select "Invite Members."

Q: How do I delete my account?
A: Go to Settings > Account > Delete Account. This action is permanent.

Q: Is my data private?
A: Yes! Only members of your circles can see your posts. We never share or sell your data.

CONTACT US

Email: support@realones.app

We typically respond within 24-48 hours.

REPORT A BUG

Found a bug? Email bugs@realones.app with:
- Description of the issue
- Steps to reproduce
- Your device model and iOS version`),

      new Paragraph({ children: [new PageBreak()] }),

      // ==================== SCREENSHOT REQUIREMENTS ====================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("6. Screenshot Requirements")]
      }),

      new Paragraph({
        children: [new TextRun({ text: "Required screenshot sizes:", bold: true })]
      }),
      new Paragraph({ children: [] }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("iPhone 6.7\" Display (Required)")]
      }),
      new Paragraph({
        children: [new TextRun("1290 x 2796 pixels (iPhone 15 Pro Max, 14 Pro Max)")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "Minimum 3 screenshots, maximum 10", italics: true, color: "666666" })]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("iPhone 6.5\" Display (Required)")]
      }),
      new Paragraph({
        children: [new TextRun("1242 x 2688 pixels OR 1284 x 2778 pixels")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun("iPhone 5.5\" Display (Required)")]
      }),
      new Paragraph({
        children: [new TextRun("1242 x 2208 pixels")]
      }),

      new Paragraph({ children: [] }),
      new Paragraph({
        children: [new TextRun({ text: "Tip: Take screenshots on iPhone 15 Pro Max or use Simulator. You can often use the same screenshots for multiple sizes.", italics: true, color: "666666" })]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ==================== CHECKLIST ====================
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("7. Submission Checklist")]
      }),

      new Paragraph({ children: [] }),
      createChecklistItem("App icon uploaded (1024x1024)"),
      createChecklistItem("Screenshots for all required sizes"),
      createChecklistItem("App description filled in"),
      createChecklistItem("Keywords added"),
      createChecklistItem("Privacy policy URL live and accessible"),
      createChecklistItem("Support URL live and accessible"),
      createChecklistItem("Contact information complete"),
      createChecklistItem("Demo account created (if app requires sign-in)"),
      createChecklistItem("App Review notes provided"),
      createChecklistItem("Age rating questionnaire completed"),
      createChecklistItem("Pricing and availability set"),
      createChecklistItem("Build selected for submission"),
    ]
  }]
});

// Helper function to create a copy box
function createCopyBox(text) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: border, bottom: border, left: border, right: border };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: text.split('\n').map(line =>
              new Paragraph({
                children: [new TextRun({ text: line, font: "Courier New", size: 22 })]
              })
            )
          })
        ]
      })
    ]
  });
}

// Helper function for checklist items
function createChecklistItem(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    children: [new TextRun({ text: "☐  " + text, size: 24 })]
  });
}

// Generate the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/sessions/funny-dazzling-faraday/mnt/realones-app/AppStore_Submission_Content.docx", buffer);
  console.log("Document created: AppStore_Submission_Content.docx");
});
