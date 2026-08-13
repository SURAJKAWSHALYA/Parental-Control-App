package com.parentalcontrol.child

import android.content.Context
import android.net.Uri
import com.parentalcontrol.child.data.AppDatabase

class WebsiteRestrictionManager(context: Context) {
    private val websiteRuleDao = AppDatabase.getDatabase(context).websiteRuleDao()

    // Caches to avoid DB lookups on every URL change
    private var blockedDomains = setOf<String>()
    private var allowedDomains = setOf<String>()
    private var blockedCategories = setOf<String>()

    // Simple mocked category resolution for domains (In a real app, this would use an API or large local hash map)
    private val mockDomainCategories = mapOf(
        "pornhub.com" to "Adult Content",
        "bet365.com" to "Gambling",
        "facebook.com" to "Social Media",
        "instagram.com" to "Social Media",
        "roblox.com" to "Gaming",
        "netflix.com" to "Streaming",
        "amazon.com" to "Shopping"
    )

    suspend fun refreshCache() {
        val rules = websiteRuleDao.getActiveRules()
        val categories = websiteRuleDao.getActiveCategories()

        blockedDomains = rules.filter { it.type == "BLOCK" }.map { it.domain }.toSet()
        allowedDomains = rules.filter { it.type == "ALLOW" }.map { it.domain }.toSet()
        blockedCategories = categories.filter { it.blocked }.map { it.category }.toSet()
    }

    fun isUrlBlocked(url: String): Boolean {
        try {
            var uri = Uri.parse(url)
            if (uri.scheme == null) {
                uri = Uri.parse("https://$url")
            }
            
            var host = uri.host?.toLowerCase() ?: return false
            if (host.startsWith("www.")) {
                host = host.substring(4)
            }

            // 1. Check Explicit Allowlist (Highest priority)
            if (allowedDomains.contains(host)) {
                return false
            }

            // 2. Check Explicit Blocklist
            if (blockedDomains.contains(host)) {
                return true
            }

            // 3. Check Category Blocklist
            val category = mockDomainCategories[host]
            if (category != null && blockedCategories.contains(category)) {
                return true
            }

            return false
        } catch (e: Exception) {
            return false // Fail open for unparseable URLs
        }
    }
}
