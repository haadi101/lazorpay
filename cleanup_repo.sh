#!/bin/bash

# LazorPay Cleanup Script
echo "Staging all changes..."
git add .

echo "Committing with professional message..."
git commit -m "refactor: optimize imports and update documentation"

echo "Done! Ready for push."
echo "Optional: To squash previous commits, run 'git rebase -i HEAD~N' where N is the number of commits."
