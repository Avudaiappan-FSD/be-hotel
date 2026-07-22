const User = require('../models/User');
const userController = {

    getprofile: async (req, res) => {
        try {
            const userId = req.userId;
            const user = await User.findById(userId);
            res.status(200).json({ user: user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updateprofile: async (req, res) => {
        try {
            const userId = req.userId;
            const {name, email} = req.body;
            const updatedUser = await User.findByIdAndUpdate(userId, { name, email }, { new: true });
            res.status(200).json({ message: "User", user: updatedUser });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    deleteprofile: async (req, res) => {
        try {
            const userId = req.userId;
            const deletedUser = await User.findByIdAndDelete(userId);
            res.clearCookie('token');   
            res.status(200).json({ message: "User deleted successfully"});
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
   

}
module.exports = userController;