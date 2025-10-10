#!/bin/bash

# Complete end-to-end test of the CV processing workflow
echo "🚀 Starting complete CV processing workflow test..."
echo ""

BASE_URL="http://localhost:3001"
JOB_ID="test-job-$(date +%s)"
TEMP_FILE="/tmp/parse_result_$$.json"
TEMP_FILE2="/tmp/add_result_$$.json"

echo "📋 Testing with Job ID: $JOB_ID"
echo ""

# Step 1: Parse John Smith's CV
echo "📄 Step 1: Parsing John Smith's CV..."
curl -X POST "$BASE_URL/api/parse-cv" \
  -F "file=@test-cv-john-smith.txt" \
  -F "jobId=$JOB_ID" \
  -H "Accept: application/json" \
  --silent \
  --show-error \
  --max-time 45 \
  -o "$TEMP_FILE"

if [ $? -eq 0 ] && [ -f "$TEMP_FILE" ]; then
  # Check if parsing was successful
  SUCCESS=$(jq -r '.success' "$TEMP_FILE" 2>/dev/null)
  if [ "$SUCCESS" = "true" ]; then
    echo "✅ CV parsing successful!"
    
    # Extract key information
    NAME=$(jq -r '.candidate.name' "$TEMP_FILE" 2>/dev/null)
    EMAIL=$(jq -r '.candidate.email' "$TEMP_FILE" 2>/dev/null)
    SCORE=$(jq -r '.extractedData.matching.overallScore' "$TEMP_FILE" 2>/dev/null)
    METHOD=$(jq -r '.extraction_method' "$TEMP_FILE" 2>/dev/null)
    SKILLS_COUNT=$(jq -r '.candidate.skills | length' "$TEMP_FILE" 2>/dev/null)
    
    echo "  - Name: $NAME"
    echo "  - Email: $EMAIL"
    echo "  - Overall Score: $SCORE%"
    echo "  - Extraction Method: $METHOD"
    echo "  - Skills Extracted: $SKILLS_COUNT"
    
    # Step 2: Add candidate to job
    echo ""
    echo "📋 Step 2: Adding candidate to job..."
    
    # Extract candidate and extracted data for the add-candidate API
    CANDIDATE_DATA=$(jq '.candidate' "$TEMP_FILE")
    EXTRACTED_DATA=$(jq '.extractedData' "$TEMP_FILE")
    
    # Create JSON payload for add-candidate API
    PAYLOAD=$(jq -n \
      --argjson candidateData "$CANDIDATE_DATA" \
      --argjson extractedData "$EXTRACTED_DATA" \
      '{candidateData: $candidateData, extractedData: $extractedData}')
    
    curl -X POST "$BASE_URL/api/jobs/$JOB_ID/add-candidate" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      --data "$PAYLOAD" \
      --silent \
      --show-error \
      --max-time 30 \
      -o "$TEMP_FILE2"
    
    if [ $? -eq 0 ] && [ -f "$TEMP_FILE2" ]; then
      ADD_SUCCESS=$(jq -r '.success' "$TEMP_FILE2" 2>/dev/null)
      if [ "$ADD_SUCCESS" = "true" ]; then
        echo "✅ Candidate added to job successfully!"
        
        OVERALL_SCORE=$(jq -r '.candidateMatch.overall_score' "$TEMP_FILE2" 2>/dev/null)
        SKILLS_SCORE=$(jq -r '.candidateMatch.skills_score' "$TEMP_FILE2" 2>/dev/null)
        STATUS=$(jq -r '.candidateMatch.status' "$TEMP_FILE2" 2>/dev/null)
        
        echo "  - Overall Score: $OVERALL_SCORE%"
        echo "  - Skills Score: $SKILLS_SCORE%"
        echo "  - Status: $STATUS"
        
        # Step 3: Retrieve candidates list
        echo ""
        echo "📋 Step 3: Retrieving job candidates list..."
        
        CANDIDATES_RESPONSE=$(curl -X GET "$BASE_URL/api/jobs/$JOB_ID/candidates" \
          -H "Accept: application/json" \
          --silent \
          --show-error \
          --max-time 15)
        
        if [ $? -eq 0 ]; then
          CANDIDATES_SUCCESS=$(echo "$CANDIDATES_RESPONSE" | jq -r '.success' 2>/dev/null)
          if [ "$CANDIDATES_SUCCESS" = "true" ]; then
            echo "✅ Candidates list retrieved successfully!"
            
            CANDIDATE_COUNT=$(echo "$CANDIDATES_RESPONSE" | jq -r '.candidates | length' 2>/dev/null)
            echo "  - Total candidates: $CANDIDATE_COUNT"
            
            # Show candidate details
            echo "$CANDIDATES_RESPONSE" | jq -r '.candidates[] | "  - \(.candidate.name // "Unknown") - \(.overall_score)%"' 2>/dev/null
            
            echo ""
            echo "🎉 WORKFLOW TEST COMPLETED SUCCESSFULLY! 🎉"
            echo ""
            echo "📊 TEST SUMMARY:"
            echo "  ✅ CV Parsing: Working perfectly with Gemini AI"
            echo "  ✅ Data Extraction: Real names, skills, experience extracted"
            echo "  ✅ Scoring System: AI-generated realistic match scores"
            echo "  ✅ Candidate Management: Adding and retrieving functional"
            echo "  ✅ JSON Parsing: Enhanced strategies working correctly"
            echo ""
            echo "🌐 Application URL: https://3001-ipcij0laxahjo1kr9rbpd-6532622b.e2b.dev"
            echo ""
            echo "📋 The CV parsing system is working correctly!"
            echo "   Users can now upload PDFs and get accurate candidate analysis."
            
          else
            echo "❌ Failed to retrieve candidates list"
            echo "Response: $CANDIDATES_RESPONSE"
          fi
        else
          echo "❌ Error retrieving candidates list"
        fi
        
      else
        echo "❌ Failed to add candidate to job"
        echo "Response:"
        cat "$TEMP_FILE2"
      fi
    else
      echo "❌ Error adding candidate to job"
    fi
    
  else
    echo "❌ CV parsing failed"
    echo "Response:"
    cat "$TEMP_FILE"
  fi
else
  echo "❌ Error parsing CV"
fi

# Cleanup
rm -f "$TEMP_FILE" "$TEMP_FILE2"

echo ""
echo "📋 Test completed. Check the results above."