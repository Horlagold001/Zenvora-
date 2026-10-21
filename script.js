"use strict";

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. ZENVORA CONFIGURATION
    // ==========================================

    const STORAGE_KEY = "zenvoraOpportunities";

    const navigationButtons = document.querySelectorAll(
        'button[data-page], a[data-page], .nav-item[data-page], .nav-link[data-page]'
    );

    const pageSections = document.querySelectorAll(
        "main#app .page"
    );

    const homeListings = document.getElementById("homeListings");
    const homeEmpty = document.getElementById("homeEmpty");

    const discoverListings = document.getElementById("discoverListings");
    const discoverEmpty = document.getElementById("discoverEmpty");

    const businessListings = document.getElementById("businessListings");
    const businessEmpty = document.getElementById("businessEmpty");

    const opportunityForm = document.getElementById("opportunityForm");

    const titleInput = document.getElementById("title");
    const categoryInput = document.getElementById("category");
    const typeInput = document.getElementById("type");
    const descriptionInput = document.getElementById("description");
    const locationInput = document.getElementById("location");
    const contactInput = document.getElementById("contactName");
    const phoneInput = document.getElementById("phone");

    const searchInput = document.getElementById("searchInput");
    const resultsLabel = document.getElementById("resultsLabel");

    const myListingCount = document.getElementById("myListingCount");
    const businessName = document.getElementById("businessName");
    const businessPhone = document.getElementById("businessPhone");

    const clearDataButton = document.getElementById("clearDataButton");

    let activeCategory = "all";


    // ==========================================
    // 2. LOCAL STORAGE FUNCTIONS
    // ==========================================

    function getOpportunities() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return [];
            }

            const opportunities = JSON.parse(saved);

            return Array.isArray(opportunities) ? opportunities : [];

        } catch (error) {
            console.error("Could not read opportunities:", error);
            return [];
        }
    }


    function saveOpportunities(opportunities) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(opportunities)
            );

            return true;

        } catch (error) {
            console.error("Could not save opportunities:", error);

            alert(
                "Your browser could not save this opportunity. " +
                "Please check your available storage."
            );

            return false;
        }
    }


    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (character) {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];
        });
    }


    function getFieldValue(element) {
        return element ? element.value.trim() : "";
    }


    function showEmpty(element, shouldShow) {
        if (element) {
            element.hidden = !shouldShow;
        }
    }


    // ==========================================
    // 3. NAVIGATION
    // ==========================================

    function openPage(target) {

        if (!target) {
            return;
        }

        const pageId = target.replace(/^#/, "");

        const targetPage = document.getElementById(pageId);

        if (!targetPage || !targetPage.classList.contains("page")) {
            console.warn("Zenvora page not found:", pageId);
            return;
        }

        // Show the selected page and hide the others.
        pageSections.forEach(function (page) {
            page.classList.toggle("active", page === targetPage);
        });

        // Update active navigation buttons.
        navigationButtons.forEach(function (button) {
            button.classList.toggle(
                "active",
                button.dataset.page === pageId
            );
        });

        // Refresh listings when changing pages.
        renderAllOpportunities();

        // Return to the top of the page.
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    navigationButtons.forEach(function (button) {

        button.addEventListener("click", function (event) {

            const target = button.dataset.page;

            if (!target) {
                return;
            }

            event.preventDefault();

            openPage(target);
        });

    });


    // ==========================================
    // 4. CREATE OPPORTUNITY CARDS
    // ==========================================

    function createOpportunityCard(opportunity) {

        const title = escapeHTML(opportunity.title);
        const category = escapeHTML(opportunity.category);
        const location = escapeHTML(opportunity.location);
        const description = escapeHTML(opportunity.description);
        const type = escapeHTML(opportunity.type || "Opportunity");
        const contact = escapeHTML(opportunity.contactName || "");
        const phone = String(opportunity.phone || "").replace(/[^\d+]/g, "");
        const date = escapeHTML(opportunity.date || "");
        const id = escapeHTML(opportunity.id);

        const card = document.createElement("article");

        card.className = "opportunity-card";

        card.innerHTML = `
            <div class="opportunity-card-content">

                <div class="opportunity-card-top">
                    <span class="opportunity-category">
                        ${category}
                    </span>

                    <span class="opportunity-type">
                        ${type}
                    </span>
                </div>

                <h3>${title}</h3>

                <p class="opportunity-description">
                    ${description || "No description provided."}
                </p>

                <p class="opportunity-location">
                    📍 ${location || "Location not specified"}
                </p>

                <div class="opportunity-card-footer">

                    <small>${date}</small>

                    ${
                        contact
                            ? `<small>Posted by ${contact}</small>`
                            : ""
                    }

                </div>

                <div class="opportunity-card-actions">

                    <button
                        type="button"
                        class="save-opportunity-button"
                        data-save-id="${id}">
                        Save Opportunity
                    </button>

                    ${
                        phone
                            ? `<a
                                class="contact-opportunity-button"
                                href="https://wa.me/${phone.replace(/^\+/, "")}"
                                target="_blank"
                                rel="noopener noreferrer">
                                Contact
                            </a>`
                            : ""
                    }

                </div>

            </div>
        `;

        return card;
    }


    // ==========================================
    // 5. RENDER OPPORTUNITY LISTINGS
    // ==========================================

    function renderListings(container, emptyElement, opportunities) {

        if (!container) {
            return;
        }

        container.innerHTML = "";

        if (opportunities.length === 0) {
            showEmpty(emptyElement, true);
            return;
        }

        showEmpty(emptyElement, false);

        opportunities.forEach(function (opportunity) {

            const card = createOpportunityCard(opportunity);

            container.appendChild(card);

        });
    }


    function renderHome() {

        const opportunities = getOpportunities();

        // Show the latest opportunities first.
        const latest = opportunities.slice().reverse().slice(0, 6);

        renderListings(
            homeListings,
            homeEmpty,
            latest
        );
    }


    function renderDiscover() {

        let opportunities = getOpportunities();

        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        // Filter by category.
        if (activeCategory !== "all") {

            opportunities = opportunities.filter(function (opportunity) {

                return String(opportunity.category || "").toLowerCase() ===
                    activeCategory.toLowerCase();

            });
        }

        // Search title, category, location and description.
        if (searchTerm) {

            opportunities = opportunities.filter(function (opportunity) {

                const searchableText = [
                    opportunity.title,
                    opportunity.category,
                    opportunity.location,
                    opportunity.description,
                    opportunity.type
                ].join(" ").toLowerCase();

                return searchableText.includes(searchTerm);

            });
        }

        opportunities = opportunities.slice().reverse();

        renderListings(
            discoverListings,
            discoverEmpty,
            opportunities
        );

        if (resultsLabel) {
            resultsLabel.textContent =
                opportunities.length +
                (opportunities.length === 1
                    ? " opportunity found"
                    : " opportunities found");
        }
    }


    function renderBusiness() {

        const opportunities = getOpportunities();

        renderListings(
            businessListings,
            businessEmpty,
            opportunities.slice().reverse()
        );

        if (myListingCount) {
            myListingCount.textContent = String(opportunities.length);
        }

        // Show the contact details of the latest listing if available.
        if (opportunities.length > 0) {

            const latest = opportunities[opportunities.length - 1];

            if (businessName && latest.contactName) {
                businessName.textContent = latest.contactName;
            }

            if (businessPhone && latest.phone) {
                businessPhone.textContent = latest.phone;
            }
        }
    }


    function renderAllOpportunities() {

        renderHome();

        renderDiscover();

        renderBusiness();
    }


    // ==========================================
    // 6. POST A NEW OPPORTUNITY
    // ==========================================

    if (opportunityForm) {

        opportunityForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const title = getFieldValue(titleInput);
            const category = getFieldValue(categoryInput);
            const type = getFieldValue(typeInput);
            const description = getFieldValue(descriptionInput);
            const location = getFieldValue(locationInput);
            const contactName = getFieldValue(contactInput);
            const phone = getFieldValue(phoneInput);

            // Validate required fields.
            if (!title || !category || !location) {

                alert(
                    "Please enter an opportunity title, category, and location."
                );

                return;
            }

            const opportunity = {
                id: "zenvora_" + Date.now(),
                title: title,
                category: category,
                type: type,
                description: description,
                location: location,
                contactName: contactName,
                phone: phone,
                date: new Date().toLocaleDateString(),
                status: "active"
            };

            const opportunities = getOpportunities();

            opportunities.push(opportunity);

            // Save the opportunity locally first.
            const saved = saveOpportunities(opportunities);

            if (!saved) {
                return;
            }

            // Refresh all listing areas.
            renderAllOpportunities();

            // Reset the form after a successful local save.
            opportunityForm.reset();

            alert(
                "Your opportunity has been published on this device."
            );

            // Save to Supabase if a client is available.
            if (
                window.supabaseClient &&
                typeof window.supabaseClient.from === "function"
            ) {
                try {
                    const client = window.supabaseClient;

                    const { data: authData, error: authError } =
                        await client.auth.getUser();

                    if (authError) {
                        throw authError;
                    }

                    if (!authData.user) {
                        console.log(
                            "Sign in to publish this opportunity to Supabase."
                        );
                        return;
                    }

                    const { error } = await client
                        .from("opportunities")
                        .insert({
                            user_id: authData.user.id,
                            title: title,
                            category: category,
                            type: type,
                            description: description,
                            location: location,
                            contact_name: contactName,
                            phone: phone,
                            status: "active"
                        });

                    if (error) {
                        throw error;
                    }

                    console.log(
                        "Opportunity saved to Supabase successfully."
                    );

                } catch (error) {
                    console.error(
                        "Supabase connection error:",
                        error
                    );

                    alert(
                        "Your opportunity was saved locally, but publishing " +
                        "to the shared database failed. Check the console."
                    );
                }
            }

                    });

    } else {

        console.warn(
            "Zenvora: The opportunity form with ID 'opportunityForm' was not found."
        );

    }


    // ==========================================
    // 7. SEARCH OPPORTUNITIES
    // ==========================================

    if (searchInput) {

        searchInput.addEventListener("input", function () {

            renderDiscover();

        });

    }


    // ==========================================
    // 8. CATEGORY FILTER BUTTONS
    // ==========================================

    const filterButtons = document.querySelectorAll(".filter-chip");

    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            filterButtons.forEach(function (otherButton) {
                otherButton.classList.remove("active");
            });

            button.classList.add("active");

            activeCategory = (
                button.dataset.filter || "all"
            ).trim();

            renderDiscover();

        });

    });


    // ==========================================
    // 9. SAVE AN OPPORTUNITY
    // ==========================================

    document.addEventListener("click", function (event) {

        const button = event.target.closest(".save-opportunity-button");

        if (!button) {
            return;
        }

        const opportunityId = button.dataset.saveId;

        const savedOpportunities = getSavedOpportunities();

        if (savedOpportunities.includes(opportunityId)) {

            alert("You have already saved this opportunity.");

            return;
        }

        savedOpportunities.push(opportunityId);

        try {

            localStorage.setItem(
                "zenvoraSavedOpportunities",
                JSON.stringify(savedOpportunities)
            );

            alert("Opportunity saved successfully.");

        } catch (error) {

            console.error("Could not save opportunity:", error);

            alert("Could not save this opportunity.");

        }

    });


    function getSavedOpportunities() {

        try {

            const saved = localStorage.getItem(
                "zenvoraSavedOpportunities"
            );

            return saved ? JSON.parse(saved) : [];

        } catch (error) {

            return [];
        }
    }


    // ==========================================
    // 10. CLEAR LOCAL OPPORTUNITY DATA
    // ==========================================

    if (clearDataButton) {

        clearDataButton.addEventListener("click", function () {

            const confirmed = confirm(
                "Do you want to delete locally saved Zenvora opportunities?"
            );

            if (!confirmed) {
                return;
            }

            localStorage.removeItem(STORAGE_KEY);

            renderAllOpportunities();

            alert("Locally saved opportunities have been cleared.");

        });

    }


    // ==========================================
    // 11. INITIALIZE ZENVORA
    // ==========================================

    // Make sure the correct page is visible on startup.
    const activePage = document.querySelector(
        "main#app .page.active"
    );

    if (!activePage && pageSections.length > 0) {

        pageSections.forEach(function (page, index) {
            page.classList.toggle("active", index === 0);
        });

    }

    // Set the default category filter.
    filterButtons.forEach(function (button) {

        const filter = button.dataset.filter || "all";

        button.classList.toggle(
            "active",
            filter.toLowerCase() === "all"
        );

    });

    activeCategory = "all";

    renderAllOpportunities();

    console.log("ZENVORA script loaded successfully.");

});

// ==========================================
// ZENVORA SUPABASE AUTHENTICATION
// ==========================================

const authForm = document.getElementById("authForm");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const authHeading = document.getElementById("authHeading");
const authDescription = document.getElementById("authDescription");
const authMessage = document.getElementById("authMessage");

const authSubmitButton = document.getElementById("authSubmitButton");
const authSwitchButton = document.getElementById("authSwitchButton");
const authSwitchText = document.getElementById("authSwitchText");

const nameField = document.getElementById("nameField");

const authCard = document.getElementById("authCard");
const loggedInCard = document.getElementById("loggedInCard");

const loggedInName = document.getElementById("loggedInName");
const loggedInEmail = document.getElementById("loggedInEmail");
const logoutButton = document.getElementById("logoutButton");

let authMode = "signup";

function setAuthMessage(message) {
    if (authMessage) {
        authMessage.textContent = message;
    }
}

function setAuthMode(mode) {

    authMode = mode;

    if (authMode === "signup") {

        authHeading.textContent = "Create your account";
        authDescription.textContent =
            "Join Zenvora and discover new opportunities.";

        authSubmitButton.textContent = "Create Account";

        authSwitchText.textContent = "Already have an account?";

        authSwitchButton.textContent = "Log in";

        nameField.hidden = false;

        authPassword.setAttribute("autocomplete", "new-password");

    } else {

        authHeading.textContent = "Welcome back";

        authDescription.textContent =
            "Log in to your Zenvora account.";

        authSubmitButton.textContent = "Log In";

        authSwitchText.textContent = "New to Zenvora?";

        authSwitchButton.textContent = "Create account";

        nameField.hidden = true;

        authPassword.setAttribute("autocomplete", "current-password");
    }

    setAuthMessage("");
}

function showAuthenticatedAccount(user) {

    if (!user) {
        return;
    }

    if (authCard) {
        authCard.hidden = true;
    }

    if (loggedInCard) {
        loggedInCard.hidden = false;
    }

    const metadata = user.user_metadata || {};

    if (loggedInName) {
        loggedInName.textContent =
            metadata.full_name || "Welcome to Zenvora!";
    }

    if (loggedInEmail) {
        loggedInEmail.textContent = user.email || "";
    }
}

function showSignedOutAccount() {

    if (authCard) {
        authCard.hidden = false;
    }

    if (loggedInCard) {
        loggedInCard.hidden = true;
    }
}


// Switch between registration and login.
if (authSwitchButton) {

    authSwitchButton.addEventListener("click", function () {

        setAuthMode(
            authMode === "signup" ? "login" : "signup"
        );

    });

}


// Register or log in.
if (authForm) {

    authForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const client = window.supabaseClient;

        if (!client) {

            setAuthMessage(
                "Supabase is not initialized. Check your connection setup."
            );

            return;
        }

        const email = authEmail.value.trim();
        const password = authPassword.value;
        const fullName = authName.value.trim();

        if (authMode === "signup" && !fullName) {

            setAuthMessage("Please enter your full name.");

            return;
        }

        if (password.length < 8) {

            setAuthMessage(
                "Your password must contain at least 8 characters."
            );

            return;
        }

        authSubmitButton.disabled = true;

        authSubmitButton.textContent = "Please wait...";

        setAuthMessage("");

        try {

            if (authMode === "signup") {

                const { data, error } = await client.auth.signUp({

                    email: email,

                    password: password,

                    options: {
                        data: {
                            full_name: fullName
                        }
                    }

                });

                if (error) {
                    throw error;
                }

                if (data.session && data.user) {

                    showAuthenticatedAccount(data.user);

                    setAuthMessage("Your account was created successfully.");

                } else {

                    setAuthMessage(
                        "Registration successful. Check your email " +
                        "for the verification link, then log in."
                    );

                    setAuthMode("login");
                }

            } else {

                const { data, error } =
                    await client.auth.signInWithPassword({

                        email: email,

                        password: password

                    });

                if (error) {
                    throw error;
                }

                showAuthenticatedAccount(data.user);

                authForm.reset();

                setAuthMessage("You are logged in successfully.");

                renderAllOpportunities();

            }

        } catch (error) {

            console.error("Zenvora authentication error:", error);

            setAuthMessage(error.message || "Authentication failed.");

        } finally {

            authSubmitButton.disabled = false;

            authSubmitButton.textContent =
                authMode === "signup" ? "Create Account" : "Log In";
        }

    });

}


// Log out.
if (logoutButton) {

    logoutButton.addEventListener("click", async function () {

        const client = window.supabaseClient;

        if (!client) {
            return;
        }

        logoutButton.disabled = true;

        try {

            const { error } = await client.auth.signOut();

            if (error) {
                throw error;
            }

            showSignedOutAccount();

            setAuthMode("login");

            setAuthMessage("You have logged out.");

        } catch (error) {

            console.error("Zenvora logout error:", error);

            alert("Could not log out: " + error.message);

        } finally {

            logoutButton.disabled = false;
        }

    });

}
function showSignedOutAccount() {
    if (authCard) {
        authCard.hidden = false;
    }

    if (loggedInCard) {
        loggedInCard.hidden = true;
    }
}

// Restore the session when the app opens.
async function initializeZenvoraAuth() {

    const client = window.supabaseClient;

    if (!client) {
        setAuthMessage("Supabase connection is unavailable.");
        return;
    }

    try {

        const { data, error } = await client.auth.getSession();

        if (error) {
            throw error;
        }

        if (data.session && data.session.user) {

            showAuthenticatedAccount(data.session.user);

        } else {

            showSignedOutAccount();
            setAuthMode("signup");

        }

    } catch (error) {

        console.error("Could not restore Zenvora session:", error);

        setAuthMessage("Could not check your login session.");

    }
}

initializeZenvoraAuth();

console.log("Zenvora authentication module loaded.");

// ZENVORA FOUNDER DASHBOARD
(function () {
    function initializeFounderDashboard() {
        const openButton = document.getElementById("zenvora-dashboard-open");
        const closeButton = document.getElementById("zenvora-dashboard-close");
        const dashboard = document.getElementById("founderDashboard");

        if (!openButton || !closeButton || !dashboard) {
            console.log("Dashboard setup:", {
                openButton: !!openButton,
                closeButton: !!closeButton,
                dashboard: !!dashboard
            });
            return;
        }

        // Hide the dashboard initially.
        dashboard.hidden = true;

        openButton.onclick = function () {
            dashboard.hidden = false;
            openButton.hidden = true;

            dashboard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        };

        closeButton.onclick = function () {
            dashboard.hidden = true;
            openButton.hidden = false;

            openButton.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        };

        console.log("Founder Dashboard is ready.");
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeFounderDashboard
        );
    } else {
        initializeFounderDashboard();
    }
})();

// ZENVORA FOUNDER DASHBOARD
(function () {
    function initializeFounderDashboard() {
        const openButton = document.getElementById("zenvora-dashboard-open");
        const closeButton = document.getElementById("zenvora-dashboard-close");
        const dashboard = document.getElementById("founderDashboard");

        if (!openButton || !closeButton || !dashboard) {
            console.log("Dashboard elements missing.");
            return;
        }

        // Hide the dashboard when the app first opens
        dashboard.hidden = true;

        openButton.addEventListener("click", function () {
            dashboard.hidden = false;
            dashboard.classList.add("active");
            openButton.hidden = true;

            dashboard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        closeButton.addEventListener("click", function () {
            dashboard.hidden = true;
            dashboard.classList.remove("active");
            openButton.hidden = false;

            openButton.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        });

        console.log("Founder Dashboard initialized.");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeFounderDashboard);
    } else {
        initializeFounderDashboard();
    }
})();

/* ZENVORA HAMBURGER MENU */
(function () {
    const toggle = document.getElementById("menuToggle");
    const menu = document.getElementById("navigationMenu");
    const overlay = document.getElementById("menuOverlay");
    const close = document.getElementById("menuClose");

    if (!toggle || !menu || !overlay || !close) {
        console.error("Zenvora menu elements were not found.");
        return;
    }

    function openMenu() {
        menu.classList.add("menu-open");
        overlay.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
        menu.setAttribute("aria-hidden", "false");
        document.body.classList.add("menu-active");
    }

    function closeMenu() {
        menu.classList.remove("menu-open");
        overlay.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        menu.setAttribute("aria-hidden", "true");
        document.body.classList.remove("menu-active");
    }

    toggle.addEventListener("click", function () {
        if (menu.classList.contains("menu-open")) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    close.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    menu.querySelectorAll("[data-page]").forEach(function (button) {
        button.addEventListener("click", function () {
            const pageId = button.getAttribute("data-page");
            const target = document.getElementById(pageId);

            if (!target) {
                console.error("Zenvora page not found:", pageId);
                return;
            }

            /*
             * Trigger an existing navigation button when available,
             * preserving Zenvora's current page-switching logic.
             */
            const existingButton = document.querySelector(
                '.bottom-nav [data-page="' + pageId + '"]'
            );

            if (existingButton) {
                existingButton.click();
            } else {
                document.querySelectorAll(".page").forEach(function (page) {
                    page.classList.toggle("active", page.id === pageId);
                });
            }

            closeMenu();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMenu();
        }
    });
})();

/* ZENVORA MESSAGES — SUPABASE CONNECTION */
(function () {
    const client = window.supabaseClient;

    if (!client) {
        console.error("Zenvora: Supabase client not found.");
        return;
    }

    const statusBox = document.getElementById("messages-status");
    const conversationsList = document.getElementById("conversations-list");
    const chatPanel = document.getElementById("chat-panel");
    const chatMessages = document.getElementById("chat-messages");
    const chatTitle = document.getElementById("chat-title");
    const messageForm = document.getElementById("message-form");
    const messageInput = document.getElementById("message-input");
    const closeChatButton = document.getElementById("close-chat");

    if (!statusBox || !conversationsList || !chatPanel ||
        !chatMessages || !messageForm || !messageInput) {
        console.error("Zenvora: Messages HTML elements are missing.");
        return;
    }

    let currentUser = null;
    let currentConversation = null;
    let refreshTimer = null;

    function setStatus(message) {
        statusBox.textContent = message;
    }

    function addTextElement(parent, tag, text, className) {
        const element = document.createElement(tag);
        element.textContent = text;

        if (className) {
            element.className = className;
        }

        parent.appendChild(element);
        return element;
    }

    async function getCurrentUser() {
        const { data, error } = await client.auth.getUser();

        if (error) throw error;

        if (!data.user) {
            throw new Error("Please sign in to use Messages.");
        }

        return data.user;
    }

    async function loadConversations() {
        try {
            currentUser = await getCurrentUser();

            setStatus("Loading conversations...");
            conversationsList.replaceChildren();

            const { data, error } = await client
                .from("conversations")
                .select("id, participant_one, participant_two, created_at")
                .or(
                    "participant_one.eq." + currentUser.id +
                    ",participant_two.eq." + currentUser.id
                )
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                setStatus("No conversations yet.");
                addTextElement(
                    conversationsList,
                    "p",
                    "When you start a conversation, it will appear here.",
                    "messages-empty"
                );
                return;
            }

            setStatus("Your conversations");

            data.forEach(function (conversation) {
                const otherUser =
                    conversation.participant_one === currentUser.id
                        ? conversation.participant_two
                        : conversation.participant_one;

                const button = document.createElement("button");
                button.type = "button";
                button.className = "conversation-item";

                const avatar = addTextElement(
                    button,
                    "span",
                    "Z",
                    "conversation-avatar"
                );

                const details = addTextElement(
                    button,
                    "span",
                    "",
                    "conversation-details"
                );

                addTextElement(
                    details,
                    "strong",
                    "Zenvora member",
                    ""
                );

                addTextElement(
                    details,
                    "small",
                    "Member ID: " + otherUser.slice(0, 8),
                    ""
                );

                button.addEventListener("click", function () {
                    openConversation(conversation, otherUser);
                });

                conversationsList.appendChild(button);
            });

        } catch (error) {
            console.error("Zenvora Messages:", error);
            setStatus(error.message || "Could not load conversations.");
        }
    }
    
window.openZenvoraConversation = function (conversation, otherUser) {
    return openConversation(conversation, otherUser);
};
    async function openConversation(conversation, otherUser) {
        try {
            currentConversation = conversation.id;
            chatPanel.hidden = false;
            chatMessages.replaceChildren();

            if (chatTitle) {
                chatTitle.textContent = "Zenvora member " + otherUser.slice(0, 8);
            }

            await loadMessages();

            if (refreshTimer) clearInterval(refreshTimer);

            refreshTimer = setInterval(function () {
                if (currentConversation === conversation.id) {
                    loadMessages();
                }
            }, 5000);

        } catch (error) {
            console.error("Could not open conversation:", error);
            setStatus("Could not open this conversation.");
        }
    }

    async function loadMessages() {
        if (!currentConversation || !currentUser) return;

        const { data, error } = await client
            .from("messages")
            .select("id, sender_id, message_text, created_at")
            .eq("conversation_id", currentConversation)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Could not load messages:", error);
            setStatus("Unable to load messages. Check your Supabase policies.");
            return;
        }

        chatMessages.replaceChildren();

        if (!data || data.length === 0) {
            addTextElement(
                chatMessages,
                "p",
                "No messages yet. Send the first message!",
                "messages-empty"
            );
            return;
        }

        data.forEach(function (message) {
            const sentByMe = message.sender_id === currentUser.id;

            addTextElement(
                chatMessages,
                "div",
                message.message_text,
                "message-bubble " + (sentByMe ? "sent" : "received")
            );
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    messageForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const messageText = messageInput.value.trim();

        if (!messageText || !currentConversation) return;

        const sendButton = document.getElementById("send-message");
        if (sendButton) sendButton.disabled = true;

        try {
            currentUser = await getCurrentUser();

            const { error } = await client
                .from("messages")
                .insert({
                    conversation_id: currentConversation,
                    sender_id: currentUser.id,
                    message_text: messageText
                });

            if (error) throw error;

            messageInput.value = "";
            await loadMessages();

        } catch (error) {
            console.error("Could not send message:", error);
            setStatus(error.message || "Message could not be sent.");
        } finally {
            if (sendButton) sendButton.disabled = false;
        }
    });

    if (closeChatButton) {
        closeChatButton.addEventListener("click", function () {
            currentConversation = null;
            chatPanel.hidden = true;

            if (refreshTimer) {
                clearInterval(refreshTimer);
                refreshTimer = null;
            }
        });
    }

    document.querySelectorAll('[data-page="messages"]').forEach(function (button) {
        button.addEventListener("click", function () {
            loadConversations();
        });
    });

    client.auth.onAuthStateChange(function () {
        loadConversations();
    });

    loadConversations();
})();

/* ZENVORA MEMBER SEARCH */
(function () {
    const client = window.supabaseClient;
    const form = document.getElementById("member-search-form");
    const input = document.getElementById("member-search-input");
    const results = document.getElementById("member-search-results");
    const status = document.getElementById("member-search-status");
    const button = document.getElementById("member-search-button");

    if (!client || !form || !input || !results || !status || !button) {
        console.error("Zenvora member search could not initialize.");
        return;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const term = input.value.trim();

        if (term.length < 2) {
            status.textContent = "Enter at least two characters.";
            return;
        }

        button.disabled = true;
        status.textContent = "Searching members...";
        results.replaceChildren();

        try {
            const { data: authData, error: authError } =
                await client.auth.getUser();

            if (authError) throw authError;

            if (!authData.user) {
                status.textContent = "Please sign in to find members.";
                return;
            }

            const { data, error } = await client.rpc(
                "search_zenvora_members",
                { search_term: term }
            );

            if (error) throw error;

            if (!data || data.length === 0) {
                status.textContent = "No members found.";
                return;
            }

            status.textContent = data.length + " member(s) found.";

            data.forEach(function (member) {
                const card = document.createElement("div");
                card.className = "member-result";

                const name = document.createElement("strong");
                name.textContent = member.full_name || "Zenvora Member";

                const username = document.createElement("p");
                username.textContent = member.username
                    ? "@" + member.username
                    : "Zenvora member";

                const messageButton = document.createElement("button");
                messageButton.type = "button";
                messageButton.textContent = "Start Conversation";

                messageButton.addEventListener("click", async function () {
                    messageButton.disabled = true;

                    try {
                        const { data: userData, error: userError } =
                            await client.auth.getUser();

                        if (userError) throw userError;

                        const currentUser = userData.user;

                        if (!currentUser) {
                            alert("Please sign in first.");
                            return;
                        }

                        const first = currentUser.id;
                        const second = member.id;

                        const { data: existing, error: lookupError } =
                            await client
                                .from("conversations")
                                .select("id, participant_one, participant_two")
                                .or(
                                    "and(participant_one.eq." + first +
                                    ",participant_two.eq." + second +
                                    "),and(participant_one.eq." + second +
                                    ",participant_two.eq." + first + ")"
                                )
                                .limit(1);

                        if (lookupError) throw lookupError;

                        let conversation = existing && existing[0];

                        if (!conversation) {
                            const { data: created, error: createError } =
                                await client
                                    .from("conversations")
                                    .insert({
                                        participant_one: first,
                                        participant_two: second
                                    })
                                    .select("id, participant_one, participant_two")
                                    .single();

                            if (createError) throw createError;
                            conversation = created;
                        }

                        const otherUser =
                            conversation.participant_one === first
                                ? conversation.participant_two
                                : conversation.participant_one;

                        const openChatButton = document.createElement("button");
                        openChatButton.type = "button";
                        openChatButton.textContent = "Open Conversation";
                        openChatButton.addEventListener("click", function () {
                            const chatPanel =
                                document.getElementById("chat-panel");

                            const chatTitle =
                                document.getElementById("chat-title");

                            if (chatTitle) {
                                chatTitle.textContent =
                                    member.full_name || "Zenvora Member";
                            }

                            if (chatPanel) chatPanel.hidden = false;

                            document.dispatchEvent(
                                new CustomEvent("zenvora:open-chat", {
                                    detail: {
                                        conversation: conversation,
                                        otherUser: otherUser
                                    }
                                })
                            );
                        });

                        card.appendChild(openChatButton);
                        messageButton.textContent = "Conversation Ready";
                        status.textContent =
                            "Conversation created. Tap Open Conversation.";

                        await loadConversationListSafely();

                    } catch (error) {
                        console.error("Start conversation failed:", error);
                        alert(
                            "Could not start conversation. Check your Supabase policies."
                        );
                    } finally {
                        messageButton.disabled = false;
                    }
                });

                card.appendChild(name);
                card.appendChild(username);
                card.appendChild(messageButton);
                results.appendChild(card);
            });

        } catch (error) {
            console.error("Member search failed:", error);
            status.textContent =
                "Search failed. Check the Supabase function and permissions.";
        } finally {
            button.disabled = false;
        }
    });

    async function loadConversationListSafely() {
        const messageButton =
            document.querySelector('[data-page="messages"]');

        if (messageButton) {
            // The existing Messages code can refresh the conversation list.
            messageButton.click();
        }
    }

    document.addEventListener("zenvora:open-chat", function (event) {
        const detail = event.detail;

        if (typeof openZenvoraConversation === "function") {
            openZenvoraConversation(
                detail.conversation,
                detail.otherUser
            );
        }
    });
})();