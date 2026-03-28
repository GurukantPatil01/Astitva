/**
 * Split Calculator
 * Handles all 4 split methods: equal, percentage, share, item
 */

/**
 * Calculate splits for an expense
 * @param {number} totalAmount - Total expense amount
 * @param {string} splitMethod - 'equal' | 'percentage' | 'share' | 'item'
 * @param {Array} members - Array of member IDs participating
 * @param {Object} splitDetails - Details specific to split method
 * @returns {Array} Array of { member_id, amount, percentage_or_shares, item_description }
 */
function calculateSplits(totalAmount, splitMethod, members, splitDetails = {}) {
    switch (splitMethod) {
        case 'equal':
            return equalSplit(totalAmount, members);
        case 'percentage':
            return percentageSplit(totalAmount, splitDetails.percentages);
        case 'share':
            return shareSplit(totalAmount, splitDetails.shares);
        case 'item':
            return itemSplit(splitDetails.items);
        default:
            throw new Error(`Invalid split method: ${splitMethod}`);
    }
}

/**
 * Equal split among all members
 */
function equalSplit(totalAmount, memberIds) {
    const count = memberIds.length;
    if (count === 0) throw new Error('No members to split among');

    const perPerson = Math.round((totalAmount / count) * 100) / 100;
    // Handle rounding: give remainder to first person
    const remainder = Math.round((totalAmount - perPerson * count) * 100) / 100;

    return memberIds.map((memberId, index) => ({
        member_id: memberId,
        amount: index === 0 ? perPerson + remainder : perPerson,
        percentage_or_shares: Math.round((100 / count) * 100) / 100,
        item_description: null,
    }));
}

/**
 * Percentage-based split
 * @param {Object} percentages - { memberId: percentage }
 */
function percentageSplit(totalAmount, percentages) {
    if (!percentages || Object.keys(percentages).length === 0) {
        throw new Error('Percentages are required for percentage split');
    }

    const totalPercentage = Object.values(percentages).reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(`Percentages must add up to 100, got ${totalPercentage}`);
    }

    return Object.entries(percentages).map(([memberId, pct]) => ({
        member_id: parseInt(memberId),
        amount: Math.round((totalAmount * pct) / 100 * 100) / 100,
        percentage_or_shares: pct,
        item_description: null,
    }));
}

/**
 * Share-based split (e.g., 2x for bigger room)
 * @param {Object} shares - { memberId: shareCount }
 */
function shareSplit(totalAmount, shares) {
    if (!shares || Object.keys(shares).length === 0) {
        throw new Error('Shares are required for share-based split');
    }

    const totalShares = Object.values(shares).reduce((sum, s) => sum + s, 0);
    if (totalShares === 0) throw new Error('Total shares cannot be zero');

    const perShare = totalAmount / totalShares;

    return Object.entries(shares).map(([memberId, shareCount]) => ({
        member_id: parseInt(memberId),
        amount: Math.round(perShare * shareCount * 100) / 100,
        percentage_or_shares: shareCount,
        item_description: null,
    }));
}

/**
 * Item-level split (specific items assigned to specific people)
 * @param {Array} items - [{ member_id, amount, description }]
 */
function itemSplit(items) {
    if (!items || items.length === 0) {
        throw new Error('Items are required for item-level split');
    }

    return items.map((item) => ({
        member_id: item.member_id,
        amount: Math.round(item.amount * 100) / 100,
        percentage_or_shares: null,
        item_description: item.description || null,
    }));
}

module.exports = { calculateSplits };
