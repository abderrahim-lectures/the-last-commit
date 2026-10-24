window.Python101QuizBank = {
  "office-worker-2": {
    shift: "SHIFT 00-02",
    opponent: "OFFICE WORKER",
    intro: "The office worker opens the first three shifts.",
    questions: [
      {
        prompt: "Which line writes Messenger online to the terminal?",
        options: [
          "print(\"Messenger online\")",
          "\"Messenger online\"()",
          "# print(\"Messenger online\")",
          "Messenger online = print"
        ],
        answer: 0,
        explanation: "print(\"text\") writes text to the terminal. A line starting with # is a comment."
      },
      {
        prompt: "Which value is a string?",
        options: ["5", "2.5", "\"You\"", "True"],
        answer: 2,
        explanation: "Text inside quotes is a string. 5 is an int, 2.5 is a float, and True is a bool."
      },
      {
        prompt: "jobs = [\"review\", \"postcard\", \"data\", \"backup\", \"letter\"]. What does len(jobs) return?",
        options: ["4", "5", "6", "\"letter\""],
        answer: 1,
        explanation: "len(jobs) counts the five items in the list."
      },
      {
        prompt: "Which expression reads the first job in queue?",
        options: ["queue[1]", "queue[0]", "queue[-0]", "queue.first()"],
        answer: 1,
        explanation: "Positions start at 0, so queue[0] is the first item."
      }
    ]
  },
  "caveman": {
    shift: "SHIFT 03-05",
    opponent: "CAVEMAN",
    intro: "The caveman grunts at the queue. Three shifts stand between you and the cave.",
    questions: [
      {
        prompt: "parcels = 5. Which condition is True?",
        options: ["parcels > 5", "parcels == 5", "parcels != 5", "parcels < 5"],
        answer: 1,
        explanation: "== compares two values. 5 == 5 is True."
      },
      {
        prompt: "What does range(3) produce in a for loop?",
        options: ["0, 1, 2", "1, 2, 3", "0, 1, 2, 3", "3, 2, 1"],
        answer: 0,
        explanation: "range(3) starts at 0 and stops before 3, so the loop sees 0, 1, and 2."
      },
      {
        prompt: "Which line defines a function named deliver with one parameter?",
        options: ["function deliver(box):", "def deliver(box):", "def deliver:", "deliver(box) ="],
        answer: 1,
        explanation: "A function definition starts with def, then the name and its parameters."
      },
      {
        prompt: "Which keyword sends a value back from a function?",
        options: ["send", "return", "print", "give"],
        answer: 1,
        explanation: "return ends the function and hands a value back to the caller."
      }
    ]
  },
  "factory-worker-a": {
    shift: "SHIFT 06-08",
    opponent: "FACTORY WORKER",
    intro: "The factory worker checks the manifest. Three shifts of data are next.",
    questions: [
      {
        prompt: "Which value is a dictionary?",
        options: ["[\"temple\", 1]", "(\"temple\", 1)", "{\"temple\": 1}", "<\"temple\", 1>"],
        answer: 2,
        explanation: "A dictionary uses braces and key: value pairs, such as {\"temple\": 1}."
      },
      {
        prompt: "zones = {\"temple\": \"Mountain Temple\"}. Which expression reads the value?",
        options: ["zones[\"temple\"]", "zones(\"temple\")", "zones->temple", "zones.temple()"],
        answer: 0,
        explanation: "Square brackets with the key read a dictionary value."
      },
      {
        prompt: "What does \"quest log\".upper() return?",
        options: ["\"quest log\"", "\"QUEST LOG\"", "\"Quest Log\"", "\"quest_log\""],
        answer: 1,
        explanation: "upper() returns a copy with every letter in uppercase."
      },
      {
        prompt: "Which block handles an error in Python?",
        options: ["try / except", "if / else", "for / in", "def / return"],
        answer: 0,
        explanation: "Code that may fail goes in try. The except block handles the error."
      }
    ]
  },
  "oldwoman": {
    shift: "SHIFT 09-10",
    opponent: "OLD WOMAN",
    intro: "The old woman waits at the temple gate. Two shifts remain.",
    questions: [
      {
        prompt: "Which line defines a class named Package?",
        options: ["class Package:", "def Package:", "object Package:", "new Package:"],
        answer: 0,
        explanation: "A class definition starts with class, then the class name."
      },
      {
        prompt: "Which method usually sets up a new object's attributes?",
        options: ["__init__", "__main__", "__str__", "__del__"],
        answer: 0,
        explanation: "__init__ runs when an object is created, so it can store the object's first attributes."
      },
      {
        prompt: "Inside a method, what does self refer to?",
        options: ["the class itself", "the current object", "a copy of the class", "a string with the class name"],
        answer: 1,
        explanation: "self is the object that received the method call."
      },
      {
        prompt: "Which call creates an object from the class Package?",
        options: ["Package.new()", "Package()", "new Package()", "Package.create"],
        answer: 1,
        explanation: "Calling the class name with parentheses creates an object."
      }
    ]
  },
  "diver": {
    shift: "SHIFT 11-12",
    opponent: "DIVER",
    intro: "The diver surfaces with the last two shifts.",
    questions: [
      {
        prompt: "Which class inherits from Package?",
        options: ["class Urgent(Package):", "class Package(Urgent):", "class Urgent extends Package:", "class Urgent = Package:"],
        answer: 0,
        explanation: "The parent class goes in parentheses after the new class name."
      },
      {
        prompt: "What does super().__init__() do?",
        options: ["calls the parent class initializer", "creates a copy of the object", "deletes the parent class", "starts a new thread"],
        answer: 0,
        explanation: "super() reaches the parent class, so its initializer can set up the shared state."
      },
      {
        prompt: "What is composition?",
        options: ["a class stores another object as an attribute", "a class copies its parent", "a function calls itself", "a list stores only strings"],
        answer: 0,
        explanation: "Composition builds an object from other objects stored inside it."
      },
      {
        prompt: "Which statement about a subclass is True?",
        options: ["It inherits methods from its parent.", "It cannot add new methods.", "It must delete the parent methods.", "It runs faster than its parent."],
        answer: 0,
        explanation: "A subclass receives the parent's methods and can add or replace behavior."
      }
    ]
  }
};
