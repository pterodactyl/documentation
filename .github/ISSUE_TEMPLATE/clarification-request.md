---
name: Clarification Request
about: Create a report to help us improve the clarity of the Documentation
title: "[Clarification Request]"
labels: ''
assignees: ''
---

body:
  - type: checkboxes
    id: already_searched
    attributes:
      label: "Have you checked if this is already explained elsewhere in the documentation?"
      options:
        - label: "Yes, but I still need clarification."
          required: true
  - type: markdown
    attributes:
      value: "### Please fill in all required fields before submitting."
    
  - type: input
    id: clarif_description
    attributes:
      label: "Describe the issue"
      description: "A clear and concise description of what needs to be clarified."
      placeholder: "Write your issue here..."
    validations:
      required: true  # This prevents empty reports

  - type: textarea
    id: clarif_fix
    attributes:
      label: "Proposed Clarification Steps"
      description: "What should we change to clarify this section of the Documentation?"
      placeholder: "Add your suggestion on how to clarify this section here..."
    validations:
      required: true
