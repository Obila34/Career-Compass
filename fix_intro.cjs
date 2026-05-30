const fs = require('fs');
let c = fs.readFileSync('src/pages/IntroPath.tsx', 'utf8');

c = c.replace(
  /const startAnalysis = async \(\) => \{\s*setPathAnalyzed\(true\);\s*\/\/ Ideally fetch full profiles.*\s*const mockPayload = \{[\s\S]*?\};\s*try \{[\s\S]*?\} catch\(e\) \{[\s\S]*?\}\s*\};/m,
  `const startAnalysis = async () => {
    setPathAnalyzed(true);
    const mockPayload = {
      requester: { displayName: "You", currentCity: "Global", originCity: "", startupName: "", startupStage: "", sector: ["tech"], lookingFor: [] },
      target: { displayName: "Target Founder", currentCity: "", originCity: "", startupName: "", startupStage: "", sector: ["tech"] },
      connectors: [{ displayName: "Connector A", currentCity: "Global", startupName: "" }]
    };
    try {
      const db = (await import('../lib/firebase/client')).db;
      const {doc, getDoc} = require('firebase/firestore');
      if (userId) {
         try {
           const snap = await getDoc(doc(db, 'users', userId));
           if (snap.exists()) {
             mockPayload.target = snap.data();
           } else {
             const MOCK_NETWORK_USERS = require('../lib/seeds/seedNetworkProfiles').MOCK_NETWORK_USERS;
             const mockUser = MOCK_NETWORK_USERS.find(u => u.id === userId);
             if (mockUser) mockPayload.target = mockUser;
           }
         } catch(err) {}
      }
      
      const res = await fetch('/api/profile/score-intro-path', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(mockPayload)
      });
      const data = await res.json();
      setScoreData(data);
    } catch(e) {
      console.error(e);
      setScoreData({
         strengthScore: 75,
         strengthLabel: "Good",
         explanation: "You share common industry background.",
         sharedContext: ["Same sector"],
         suggestedApproach: "Mention your shared background."
      });
    }
  };`
);

// We should also replace the Draft API call target string to match
c = c.replace(
  /target: \{ displayName: "Target Founder" \},/g,
  `target: { displayName: scoreData?.target?.displayName || "Target Founder" },\n           targetProfile: scoreData?.target,`
);

fs.writeFileSync('src/pages/IntroPath.tsx', c);
