document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 5000);
      });

      const fetchPromise = fetch("/activities").then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      });

      const activities = await Promise.race([fetchPromise, timeoutPromise]);

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list
        let participantsHtml = '<p><strong>Participants:</strong></p>';
        if (details.participants.length > 0) {
          participantsHtml += '<ul>';
          details.participants.forEach(participant => {
            participantsHtml += `<li>${participant} <button class="delete-btn" data-activity="${name}" data-email="${participant}">×</button></li>`;
          });
          participantsHtml += '</ul>';
        } else {
          participantsHtml += '<p>No participants yet.</p>';
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      if (error.message === 'Request timed out') {
        activitiesList.innerHTML = "<p>Failed to load activities (timeout). Please check if the server is running.</p>";
      } else {
        activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      }
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 5000);
      });

      const fetchPromise = fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      ).then(async response => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        return response.json();
      });

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      signupForm.reset();
      // Refresh activities list
      fetchActivities();

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      if (error.message === 'Request timed out') {
        messageDiv.textContent = "Request timed out. Please check if the server is running.";
      } else {
        messageDiv.textContent = error.message || "Failed to sign up. Please try again.";
      }
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle delete participant
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const activity = event.target.dataset.activity;
      const email = event.target.dataset.email;

      if (confirm(`Are you sure you want to unregister ${email} from ${activity}?`)) {
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), 5000);
          });

          const fetchPromise = fetch(
            `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
            {
              method: "DELETE",
            }
          ).then(async response => {
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.detail || `HTTP ${response.status}`);
            }
            return response.json();
          });

          const result = await Promise.race([fetchPromise, timeoutPromise]);

          if (response.ok) {
            messageDiv.textContent = result.message;
            messageDiv.className = "success";
            // Refresh activities
            fetchActivities();
          } else {
            messageDiv.textContent = result.detail || "An error occurred";
            messageDiv.className = "error";
          }

          messageDiv.classList.remove("hidden");

          // Hide message after 5 seconds
          setTimeout(() => {
            messageDiv.classList.add("hidden");
          }, 5000);
        } catch (error) {
          if (error.message === 'Request timed out') {
            messageDiv.textContent = "Request timed out. Please check if the server is running.";
          } else {
            messageDiv.textContent = error.message || "Failed to unregister. Please try again.";
          }
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
          console.error("Error unregistering:", error);
        }
      }
    }
  })
});
