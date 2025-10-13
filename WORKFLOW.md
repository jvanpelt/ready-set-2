# Development Workflow Rules

## Git Workflow - CRITICAL RULES

### ⚠️ NEVER merge to `main` without explicit approval
- Create feature/fix branches for all work
- Commit and push to branches
- **STOP and wait for user to test on physical devices**
- Only merge to `main` after user explicitly says:
  - "merge it"
  - "looks good, merge"
  - "ready to merge"
  - Or similar clear approval

### Branch Workflow
1. Create branch: `git checkout -b feature/description` or `fix/description`
2. Make changes and commit
3. Push to branch: `git push origin branch-name`
4. **STOP HERE** - Tell user: "Changes ready on branch `xyz` for testing"
5. Wait for user approval
6. Only after approval: merge to main

### When User Says "Let's Commit"
- This means commit to the CURRENT BRANCH
- This does NOT mean merge to main
- Still wait for explicit merge approval

## Code Changes

### Before Making Changes
- Read existing code patterns
- Match existing style and structure
- Don't add features not requested
- Don't refactor code unnecessarily

### Testing
- User tests on physical iOS/Android devices
- User tests in multiple browsers
- Cache busting may be needed (version bumps)
- Always wait for user's test results before merging

## Communication

### Do:
- Explain what you're doing and why
- Ask clarifying questions if intent is unclear
- Suggest better approaches when appropriate
- Stop and wait at checkpoints

### Don't:
- Assume user has tested without confirmation
- Make assumptions about user preferences
- Add "helpful" features not requested
- Rush to completion without verification

