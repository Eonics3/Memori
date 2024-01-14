import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TextInput } from "react-native";
import { Button } from "react-native";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import axios from "axios";
import * as Speech from "expo-speech";

const db = getFirestore();
const auth = getAuth();

const tts = () => {
  const allMessages = messages.map((message) => message.content).join(" ");
  Speech.speak(allMessages);
};

const saveJournalToFirestore = async (
  topic,
  firstOutput,
  firstJournal,
  secondOutput,
  secondJournal
) => {
  const user = auth.currentUser;
  if (user) {
    try {
      await addDoc(collection(db, "users", user.uid, "journals"), {
        topic: topic,
        firstOutput: firstOutput,
        firstJournal: firstJournal,
        secondOutput: secondOutput,
        secondJournal: secondJournal,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving journal: ", error);
      // Handle the error appropriately
    }
  }
};

const ModelResponse = ({ route, navigation }) => {
  const { selectedTopic, journal1, firstOutput } = route.params;
  const [journal2, setJournal2] = useState("");
  const [messages, setMessages] = useState([]);
  const [output, setOutput] = useState([]);

  const handlePress = () => {
    saveJournalToFirestore(
      selectedTopic,
      firstOutput,
      journal1,
      output,
      journal2
    );
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }], // Replace 'Main' with the name of your initial screen in UserStack
    });
  };

  const sendMessage = async (prompt) => {
    const userMessage = { role: "user", content: prompt };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [...messages, userMessage],
          temperature: 1.0,
          max_tokens: 25,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer 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",
          },
        }
      );
      const botMessage = {
        role: "bot",
        content: response.data.choices[0].message.content,
      };
      setMessages([...messages, botMessage]);
      console.log("setting output as: ", messages);
      setOutput(botMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    let prompt = `Ask a thought provoking related follow up question to this: ${journal1}`;
    sendMessage(prompt);
  }, []);

  return (
    <View>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          marginTop: "40%",
        }}
      >
        <View
          style={{
            width: 300,
            height: 200,
            backgroundColor: "lightblue",
            padding: 16,
            borderRadius: 10,
          }}
        >
          <Text style={{ textAlign: "left" }}>
            {messages.map((message, index) => (
              <Text
                key={index}
                style={{ color: message.role === "user" ? "blue" : "green" }}
              >
                {output.content}
              </Text>
            ))}
          </Text>
        </View>
      </View>

      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          marginTop: "50%",
        }}
      >
        <TextInput
          placeholder="Write your journal prompt here"
          value={journal2}
          onChangeText={setJournal2}
          multiline
        />
      </View>
      <Button title="Finish Writing" onPress={handlePress} />
      <Button title="Text to Speech" onPress={tts} />
    </View>
  );
};

export default ModelResponse;
